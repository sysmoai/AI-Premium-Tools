interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
}

type JwtPayload = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  repository_id?: string;
  ref?: string;
  workflow_ref?: string;
  job_workflow_ref?: string;
  event_name?: string;
};

type Jwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

const BACKUP_PREFIX = "_aipt-backups/";
const OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const OIDC_AUDIENCE = "aipt-production-backup";
const REPOSITORY = "sysmoai/AI-Premium-Tools";
const REPOSITORY_ID = "1239441399";
const WORKFLOW_PREFIX = `${REPOSITORY}/.github/workflows/aipt-production-backup.yml@`;
const PUBLIC_KEY_FINGERPRINT = "8b34ab2a3e75e7adcbf3801a8c7fdda3d599d7e2b7737b83da62893139a31598";
const BACKUP_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzCyhYNNS02SX95fYet2k
5Xt9VX5IOV6mrUh0TiX+EInjAz6QFIrzuTOaltQsQdEw9WKpeUZEiVOwV8phIeAg
vHqmSIeu9u17mGTL4l38MYprpIXrDlitNDgt+1oTEVK3IsSa4tsnE7G72ek8O5ts
quPpakenn6E3JIGA9Vs1ytHTXWcxptjviGorASy70uRsRE9mPLgV6yCd7d2gN2Q6
EMOjk/6r1aAsxSA3Cp+OmL5tGDkvHXKcRA4A8rIvrEnC7D2UaMi6eEHiIImkFogD
iBhKfwr+yudyuhMXjHnNA9hI9acWoZ95wKtM9SKyvbun6Ug9AsUB2+iR64AaPRh2
54Seby9k8whiBcHdpBpTZ2fvgRikXRy6/RYB1MkSYjWV8yZC7ip33gEZjCTqO2Fl
YyQkvOmC5nBx64vWz8pM0ppEoqVqrscpgZ69jNDGI680og8MFQ914wPxB2oOP+NJ
KDI+S/LA/xlOHt5rRBwQJePxzVKkhmyH0j3iCq7GtCCdqnTd5+ByztFN3/0W8X13
FUxfYmG46M27lJl3juzl4AwzFP4WbWOcgop7T9+rr4XiDgBQRrEFEyESEjpy3Wdj
4TKFD6nqWEtssW03zeLBs9m99ruuVsbrV/0i7RNNrWou/tgJOhZobdRb+ZqmedYp
GePmF2XfYIpzTH4Hd0BSgpkCAwEAAQ==
-----END PUBLIC KEY-----`;

const encoder = new TextEncoder();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

async function sha256Bytes(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function sha256Text(value: string): Promise<string> {
  return bytesToHex(await sha256Bytes(encoder.encode(value)));
}

async function verifyGithubOidc(request: Request): Promise<JwtPayload> {
  const auth = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (!match) throw new Error("missing bearer token");
  const token = match[1];
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("invalid JWT format");

  const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0]))) as { alg?: string; kid?: string };
  const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))) as JwtPayload;
  if (header.alg !== "RS256" || !header.kid) throw new Error("unsupported JWT header");

  const configResponse = await fetch(`${OIDC_ISSUER}/.well-known/openid-configuration`, {
    headers: { accept: "application/json" },
  });
  if (!configResponse.ok) throw new Error("OIDC configuration unavailable");
  const config = await configResponse.json<{ jwks_uri?: string }>();
  if (!config.jwks_uri || !config.jwks_uri.startsWith(`${OIDC_ISSUER}/`)) throw new Error("invalid JWKS URI");

  const jwksResponse = await fetch(config.jwks_uri, { headers: { accept: "application/json" } });
  if (!jwksResponse.ok) throw new Error("OIDC JWKS unavailable");
  const jwks = await jwksResponse.json<{ keys?: Jwk[] }>();
  const jwk = jwks.keys?.find((k) => k.kid === header.kid && (!k.alg || k.alg === "RS256"));
  if (!jwk) throw new Error("JWT signing key not found");

  const verifyKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    verifyKey,
    base64UrlToBytes(parts[2]),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!verified) throw new Error("invalid JWT signature");

  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== OIDC_ISSUER) throw new Error("invalid issuer");
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.includes(OIDC_AUDIENCE)) throw new Error("invalid audience");
  if (!payload.exp || payload.exp < now - 30) throw new Error("expired token");
  if (payload.nbf && payload.nbf > now + 30) throw new Error("token not active");
  if (payload.iat && payload.iat > now + 30) throw new Error("invalid issued-at");
  if (payload.repository !== REPOSITORY || payload.repository_id !== REPOSITORY_ID) throw new Error("invalid repository identity");
  if (!payload.workflow_ref?.startsWith(WORKFLOW_PREFIX) || !payload.job_workflow_ref?.startsWith(WORKFLOW_PREFIX)) {
    throw new Error("invalid workflow identity");
  }
  const allowedMain = payload.ref === "refs/heads/main";
  const allowedPullRequest = /^refs\/pull\/\d+\/merge$/.test(payload.ref || "") && payload.event_name === "pull_request";
  if (!allowedMain && !allowedPullRequest) throw new Error("invalid ref");
  if (allowedMain && !["schedule", "workflow_dispatch", "workflow_run"].includes(payload.event_name || "")) {
    throw new Error("invalid main event");
  }
  return payload;
}

async function importBackupPublicKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    pemToDer(BACKUP_PUBLIC_KEY),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
}

async function encryptEnvelope(publicKey: CryptoKey, plaintext: Uint8Array): Promise<Uint8Array> {
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", aesKey));
  const wrappedKey = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawKey));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plaintext));
  const magic = encoder.encode("AIPTBK01");
  const wrappedLength = new Uint8Array(2);
  new DataView(wrappedLength.buffer).setUint16(0, wrappedKey.byteLength, false);
  return concatBytes([magic, wrappedLength, wrappedKey, iv, ciphertext]);
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

async function captureDatabase(db: D1Database) {
  const schema = await db
    .prepare(`SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type, name`)
    .all<Record<string, unknown>>();
  const tableRows = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all<{ name: string }>();
  const tables: Array<{ name: string; row_count: number; rows: Record<string, unknown>[] }> = [];
  let totalRows = 0;
  for (const entry of tableRows.results || []) {
    const name = String(entry.name || "");
    if (!name || name.startsWith("_cf_")) continue;
    const result = await db.prepare(`SELECT * FROM ${quoteIdentifier(name)}`).all<Record<string, unknown>>();
    const rows = result.results || [];
    totalRows += rows.length;
    if (totalRows > 250000) throw new Error("database snapshot row safety limit exceeded");
    tables.push({ name, row_count: rows.length, rows });
  }
  return {
    format: "aipt-d1-logical-v1",
    captured_at: new Date().toISOString(),
    sqlite_master: schema.results || [],
    tables,
    total_rows: totalRows,
  };
}

async function listSourceMedia(bucket: R2Bucket): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ cursor, limit: 1000, include: ["httpMetadata", "customMetadata"] });
    for (const object of page.objects) {
      if (!object.key.startsWith(BACKUP_PREFIX)) objects.push(object);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  objects.sort((a, b) => a.key.localeCompare(b.key));
  return objects;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const oidc = await verifyGithubOidc(request);
    const capturedAt = new Date().toISOString();
    const stamp = capturedAt.replace(/[:.]/g, "-");
    const snapshotPrefix = `${BACKUP_PREFIX}${stamp}/`;
    const publicKey = await importBackupPublicKey();

    const dbSnapshot = await captureDatabase(env.DB);
    const dbPlain = encoder.encode(JSON.stringify(dbSnapshot));
    if (dbPlain.byteLength > 40 * 1024 * 1024) throw new Error("database snapshot byte safety limit exceeded");
    const dbHash = bytesToHex(await sha256Bytes(dbPlain));
    const dbEncrypted = await encryptEnvelope(publicKey, dbPlain);
    const dbKey = `${snapshotPrefix}database.json.enc`;
    await env.MEDIA.put(dbKey, dbEncrypted, {
      httpMetadata: { contentType: "application/octet-stream", cacheControl: "private, no-store" },
      customMetadata: { aipt_backup: "1", payload: "database", sha256_plaintext: dbHash },
    });

    const sourceMedia = await listSourceMedia(env.MEDIA);
    const mediaManifest: Array<Record<string, unknown>> = [];
    let sourceBytes = 0;
    let newCopies = 0;
    let reusedCopies = 0;
    for (const object of sourceMedia) {
      sourceBytes += object.size;
      const identity = await sha256Text(`${object.key}\n${object.etag}\n${object.size}`);
      const backupKey = `${BACKUP_PREFIX}media/${identity}.enc`;
      let backup = await env.MEDIA.head(backupKey);
      if (!backup) {
        const source = await env.MEDIA.get(object.key);
        if (!source) throw new Error("source media disappeared during backup");
        const bytes = new Uint8Array(await source.arrayBuffer());
        if (bytes.byteLength !== object.size) throw new Error("source media changed during backup");
        const encrypted = await encryptEnvelope(publicKey, bytes);
        await env.MEDIA.put(backupKey, encrypted, {
          httpMetadata: { contentType: "application/octet-stream", cacheControl: "private, no-store" },
          customMetadata: { aipt_backup: "1", payload: "media", source_identity: identity },
        });
        backup = await env.MEDIA.head(backupKey);
        if (!backup) throw new Error("media backup verification failed");
        newCopies += 1;
      } else {
        reusedCopies += 1;
      }
      mediaManifest.push({
        key: object.key,
        size: object.size,
        etag: object.etag,
        uploaded: object.uploaded.toISOString(),
        http_metadata: object.httpMetadata || null,
        custom_metadata: object.customMetadata || null,
        backup_key: backupKey,
        source_identity: identity,
        encrypted_size: backup.size,
      });
    }

    const privateManifest = {
      format: "aipt-production-backup-v2",
      captured_at: capturedAt,
      public_key_fingerprint: PUBLIC_KEY_FINGERPRINT,
      github_oidc: {
        repository: oidc.repository,
        repository_id: oidc.repository_id,
        ref: oidc.ref,
        workflow_ref: oidc.workflow_ref,
        event_name: oidc.event_name,
      },
      database: {
        format: dbSnapshot.format,
        backup_key: dbKey,
        plaintext_sha256: dbHash,
        plaintext_bytes: dbPlain.byteLength,
        encrypted_bytes: dbEncrypted.byteLength,
        table_count: dbSnapshot.tables.length,
        total_rows: dbSnapshot.total_rows,
      },
      media: {
        source_object_count: sourceMedia.length,
        source_total_bytes: sourceBytes,
        new_encrypted_objects: newCopies,
        reused_encrypted_objects: reusedCopies,
        objects: mediaManifest,
      },
      recovery: {
        encryption: "RSA-OAEP-SHA256 wrapped AES-256-GCM per payload",
        private_key_location: "AIPT Recovery Vault — Backup Private Key — 2026-09-03 (Google Drive)",
      },
    };
    const manifestPlain = encoder.encode(JSON.stringify(privateManifest));
    const manifestHash = bytesToHex(await sha256Bytes(manifestPlain));
    const manifestEncrypted = await encryptEnvelope(publicKey, manifestPlain);
    const manifestKey = `${snapshotPrefix}manifest.json.enc`;
    await env.MEDIA.put(manifestKey, manifestEncrypted, {
      httpMetadata: { contentType: "application/octet-stream", cacheControl: "private, no-store" },
      customMetadata: { aipt_backup: "1", payload: "manifest", sha256_plaintext: manifestHash },
    });

    const dbVerify = await env.MEDIA.head(dbKey);
    const manifestVerify = await env.MEDIA.head(manifestKey);
    if (!dbVerify || dbVerify.size !== dbEncrypted.byteLength || !manifestVerify || manifestVerify.size !== manifestEncrypted.byteLength) {
      throw new Error("snapshot verification failed");
    }

    return json({
      status: "ok",
      captured_at: capturedAt,
      snapshot_id: stamp,
      encryption_key_fingerprint: PUBLIC_KEY_FINGERPRINT,
      database: {
        tables: dbSnapshot.tables.length,
        rows: dbSnapshot.total_rows,
        plaintext_bytes: dbPlain.byteLength,
        plaintext_sha256: dbHash,
        encrypted_bytes: dbEncrypted.byteLength,
      },
      media: {
        source_objects: sourceMedia.length,
        source_bytes: sourceBytes,
        new_copies: newCopies,
        reused_copies: reusedCopies,
      },
      manifest_plaintext_sha256: manifestHash,
      verified: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "backup failed";
    return json({ status: "error", error: message }, message.includes("JWT") || message.includes("token") || message.includes("repository") || message.includes("workflow") || message.includes("issuer") || message.includes("audience") || message.includes("ref") ? 401 : 500);
  }
};

export const onRequestGet: PagesFunction = async () => json({ error: "Not found" }, 404);
