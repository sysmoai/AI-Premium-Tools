import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
const API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || "").trim();
const SOURCE_DB = "aipt-db";
const SOURCE_DB_ID = "9c19dfdb-aead-4bed-b6ff-f6bf379bc296";
const SOURCE_MEDIA_BUCKET = "aipt-media";
const BACKUP_BUCKET = "aipt-backups";

if (!/^[0-9a-fA-F]{32}$/.test(ACCOUNT_ID)) throw new Error("Missing or invalid CLOUDFLARE_ACCOUNT_ID");
if (!API_TOKEN) throw new Error("Missing CLOUDFLARE_API_TOKEN");

const capturedAt = new Date().toISOString();
const stamp = capturedAt.replace(/[:.]/g, "-");
const prefix = `snapshots/${stamp}`;
const temp = mkdtempSync(join(tmpdir(), "aipt-backup-"));
const sqlPath = join(temp, "aipt-db.sql");

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sha256File = (path) => sha256(readFileSync(path));
const cfBase = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;
const authHeaders = { Authorization: `Bearer ${API_TOKEN}` };
const encodeKey = (key) => key.split("/").map(encodeURIComponent).join("/");

async function cfJson(path, init = {}) {
  const response = await fetch(`${cfBase}${path}`, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok || body?.success === false) {
    const messages = Array.isArray(body?.errors) ? body.errors.map((e) => e?.message).filter(Boolean).join("; ") : "";
    throw new Error(`Cloudflare API ${response.status} ${path}${messages ? `: ${messages}` : ""}`);
  }
  return body;
}

async function ensurePrivateBackupBucket() {
  const response = await fetch(`${cfBase}/r2/buckets/${BACKUP_BUCKET}`, { headers: authHeaders });
  if (response.ok) return "existing";
  if (response.status !== 404) {
    const text = await response.text();
    throw new Error(`Could not inspect backup bucket (${response.status}): ${text.slice(0, 300)}`);
  }
  await cfJson("/r2/buckets", {
    method: "POST",
    body: JSON.stringify({ name: BACKUP_BUCKET, locationHint: "apac", storageClass: "Standard" }),
  });
  return "created";
}

async function listObjects(bucket, prefixFilter = "") {
  const objects = [];
  let cursor = null;
  do {
    const params = new URLSearchParams({ per_page: "1000" });
    if (prefixFilter) params.set("prefix", prefixFilter);
    if (cursor) params.set("cursor", cursor);
    const page = await cfJson(`/r2/buckets/${bucket}/objects?${params.toString()}`);
    if (!Array.isArray(page.result)) throw new Error(`Unexpected R2 object-list response for ${bucket}`);
    objects.push(...page.result);
    cursor = page?.result_info?.is_truncated ? page?.result_info?.cursor || null : null;
  } while (cursor);
  return objects;
}

async function getObject(bucket, key) {
  const response = await fetch(`${cfBase}/r2/buckets/${bucket}/objects/${encodeKey(key)}`, { headers: authHeaders });
  if (!response.ok) throw new Error(`R2 GET failed for source object (${response.status})`);
  return new Uint8Array(await response.arrayBuffer());
}

async function putObject(bucket, key, bytes, contentType = "application/octet-stream") {
  const response = await fetch(`${cfBase}/r2/buckets/${bucket}/objects/${encodeKey(key)}`, {
    method: "PUT",
    headers: { ...authHeaders, "content-type": contentType },
    body: bytes,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 PUT failed for backup object (${response.status}): ${text.slice(0, 300)}`);
  }
}

function runWrangler(args) {
  return execFileSync("pnpm", ["exec", "wrangler", ...args], {
    encoding: "utf8",
    env: { ...process.env, CLOUDFLARE_API_TOKEN: API_TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function immutableMediaKey(object) {
  const rawEtag = String(object.etag || "").replace(/^\"|\"$/g, "");
  const identity = rawEtag || sha256(`${object.key}:${object.size}:${object.last_modified || ""}`);
  const safeIdentity = identity.replace(/[^A-Za-z0-9._-]/g, "_");
  return `media/objects/${safeIdentity}/${object.key}`;
}

try {
  const bucketState = await ensurePrivateBackupBucket();

  const d1Info = JSON.parse(runWrangler(["d1", "info", SOURCE_DB, "--json"]));
  const info = Array.isArray(d1Info) ? d1Info[0] : d1Info;
  if (String(info?.uuid || info?.id || "") !== SOURCE_DB_ID) throw new Error("D1 identity mismatch; refusing backup");
  if (String(info?.version || "").toLowerCase() !== "production") throw new Error("D1 is not on production storage; Time Travel assumptions invalid");

  const timeTravelRaw = JSON.parse(runWrangler(["d1", "time-travel", "info", SOURCE_DB, "--json"]));
  const timeTravel = Array.isArray(timeTravelRaw) ? timeTravelRaw[0] : timeTravelRaw;
  const bookmark = String(timeTravel?.bookmark || timeTravel?.current_bookmark || "").trim();
  if (!bookmark) throw new Error("D1 Time Travel bookmark was not returned");

  runWrangler(["d1", "export", SOURCE_DB, "--remote", `--output=${sqlPath}`, "--skip-confirmation"]);
  const sqlBytes = statSync(sqlPath).size;
  if (sqlBytes < 100) throw new Error("D1 export is unexpectedly small");
  const sqlHash = sha256File(sqlPath);
  const sqlKey = `${prefix}/d1/aipt-db.sql`;
  await putObject(BACKUP_BUCKET, sqlKey, readFileSync(sqlPath), "application/sql; charset=utf-8");

  const sourceObjects = await listObjects(SOURCE_MEDIA_BUCKET);
  const inventory = sourceObjects
    .map((o) => ({
      key: String(o.key || ""),
      size: Number(o.size || 0),
      etag: o.etag || null,
      last_modified: o.last_modified || null,
      storage_class: o.storage_class || null,
      http_metadata: o.http_metadata || null,
      custom_metadata: o.custom_metadata || null,
    }))
    .filter((o) => o.key)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((o) => ({ ...o, backup_key: immutableMediaKey(o) }));

  const inventoryJson = JSON.stringify(inventory);
  const inventoryHash = sha256(inventoryJson);
  const mediaBytes = inventory.reduce((sum, o) => sum + o.size, 0);

  const existingMirror = await listObjects(BACKUP_BUCKET, "media/objects/");
  const existingMirrorKeys = new Set(existingMirror.map((o) => String(o.key || "")));
  let newMediaObjectsCopied = 0;
  let newMediaBytesCopied = 0;
  let reusedMediaObjects = 0;

  for (const object of inventory) {
    if (existingMirrorKeys.has(object.backup_key)) {
      reusedMediaObjects += 1;
      continue;
    }
    const body = await getObject(SOURCE_MEDIA_BUCKET, object.key);
    if (body.byteLength !== object.size) throw new Error("R2 source object size changed during backup; retry capture");
    const contentType = object?.http_metadata?.contentType || object?.http_metadata?.content_type || "application/octet-stream";
    await putObject(BACKUP_BUCKET, object.backup_key, body, contentType);
    existingMirrorKeys.add(object.backup_key);
    newMediaObjectsCopied += 1;
    newMediaBytesCopied += body.byteLength;
  }

  const missingMirrorRefs = inventory.filter((o) => !existingMirrorKeys.has(o.backup_key));
  if (missingMirrorRefs.length) throw new Error(`R2 mirror verification failed for ${missingMirrorRefs.length} object(s)`);

  const privateManifest = {
    schema: "aipt-backup-manifest/v2",
    captured_at: capturedAt,
    source_commit: process.env.GITHUB_SHA || null,
    source: {
      d1: { name: SOURCE_DB, id: SOURCE_DB_ID, version: info.version, size: info.file_size ?? info.size ?? null, time_travel_bookmark: bookmark },
      r2: { bucket: SOURCE_MEDIA_BUCKET, object_count: inventory.length, total_bytes: mediaBytes, inventory },
    },
    backup: {
      bucket: BACKUP_BUCKET,
      snapshot_prefix: prefix,
      d1_sql_key: sqlKey,
      d1_sql_bytes: sqlBytes,
      d1_sql_sha256: sqlHash,
      media_strategy: "content-addressed-immutable-mirror",
      source_inventory_sha256: inventoryHash,
      media_objects_verified: inventory.length,
      new_media_objects_copied: newMediaObjectsCopied,
      new_media_bytes_copied: newMediaBytesCopied,
      reused_media_objects: reusedMediaObjects,
    },
  };
  const manifestBytes = Buffer.from(JSON.stringify(privateManifest, null, 2));
  await putObject(BACKUP_BUCKET, `${prefix}/manifest.json`, manifestBytes, "application/json; charset=utf-8");

  const snapshotObjects = await listObjects(BACKUP_BUCKET, `${prefix}/`);
  if (snapshotObjects.length !== 2) throw new Error(`Snapshot verification mismatch: expected 2 metadata/data objects, got ${snapshotObjects.length}`);

  const safeSummary = {
    status: "ok",
    captured_at: capturedAt,
    source_db: SOURCE_DB,
    source_db_version: info.version,
    d1_time_travel_bookmark_captured: true,
    d1_time_travel_bookmark_sha256_12: sha256(bookmark).slice(0, 12),
    d1_export_bytes: sqlBytes,
    d1_export_sha256: sqlHash,
    source_media_objects: inventory.length,
    source_media_bytes: mediaBytes,
    source_media_inventory_sha256: inventoryHash,
    media_objects_verified: inventory.length,
    new_media_objects_copied: newMediaObjectsCopied,
    new_media_bytes_copied: newMediaBytesCopied,
    reused_media_objects: reusedMediaObjects,
    backup_bucket: BACKUP_BUCKET,
    backup_prefix: prefix,
    snapshot_objects_verified: snapshotObjects.length,
    backup_bucket_state: bucketState,
  };

  const summaryPath = process.env.AIPT_BACKUP_SAFE_SUMMARY || join(temp, "safe-summary.json");
  writeFileSync(summaryPath, `${JSON.stringify(safeSummary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(safeSummary)}\n`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
