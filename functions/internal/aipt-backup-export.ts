interface Env {
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

type Jwk = JsonWebKey & { kid?: string; alg?: string };

const BACKUP_PREFIX = "_aipt-backups/";
const OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const OIDC_AUDIENCE = "aipt-production-backup";
const REPOSITORY = "sysmoai/AI-Premium-Tools";
const REPOSITORY_ID = "1239441399";
const WORKFLOW_PREFIX = `${REPOSITORY}/.github/workflows/aipt-production-backup.yml@refs/heads/main`;
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

  const configResponse = await fetch(`${OIDC_ISSUER}/.well-known/openid-configuration`, { headers: { accept: "application/json" } });
  if (!configResponse.ok) throw new Error("OIDC configuration unavailable");
  const config = await configResponse.json<{ jwks_uri?: string }>();
  if (!config.jwks_uri || !config.jwks_uri.startsWith(`${OIDC_ISSUER}/`)) throw new Error("invalid JWKS URI");

  const jwksResponse = await fetch(config.jwks_uri, { headers: { accept: "application/json" } });
  if (!jwksResponse.ok) throw new Error("OIDC JWKS unavailable");
  const jwks = await jwksResponse.json<{ keys?: Jwk[] }>();
  const jwk = jwks.keys?.find((k) => k.kid === header.kid && (!k.alg || k.alg === "RS256"));
  if (!jwk) throw new Error("JWT signing key not found");

  const verifyKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    verifyKey,
    base64UrlToBytes(parts[2]),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!verified) throw new Error("invalid JWT signature");

  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.iss !== OIDC_ISSUER) throw new Error("invalid issuer");
  if (!audience.includes(OIDC_AUDIENCE)) throw new Error("invalid audience");
  if (!payload.exp || payload.exp < now - 30) throw new Error("expired token");
  if (payload.nbf && payload.nbf > now + 30) throw new Error("token not active");
  if (payload.iat && payload.iat > now + 30) throw new Error("invalid issued-at");
  if (payload.repository !== REPOSITORY || payload.repository_id !== REPOSITORY_ID) throw new Error("invalid repository identity");
  if (payload.ref !== "refs/heads/main") throw new Error("invalid ref");
  if (payload.workflow_ref !== WORKFLOW_PREFIX || payload.job_workflow_ref !== WORKFLOW_PREFIX) throw new Error("invalid workflow identity");
  if (!["schedule", "workflow_dispatch", "workflow_run"].includes(payload.event_name || "")) throw new Error("invalid event");
  return payload;
}

async function listAllBackups(bucket: R2Bucket): Promise<Array<{ key: string; size: number; etag: string; uploaded: string }>> {
  const objects: Array<{ key: string; size: number; etag: string; uploaded: string }> = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: BACKUP_PREFIX, cursor, limit: 1000 });
    for (const object of page.objects) {
      objects.push({ key: object.key, size: object.size, etag: object.etag, uploaded: object.uploaded.toISOString() });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  objects.sort((a, b) => a.key.localeCompare(b.key));
  return objects;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    await verifyGithubOidc(request);
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "index";

    if (mode === "index") {
      const objects = await listAllBackups(env.MEDIA);
      const totalBytes = objects.reduce((n, object) => n + object.size, 0);
      return json({ status: "ok", encrypted_only: true, object_count: objects.length, total_bytes: totalBytes, objects });
    }

    if (mode === "download") {
      const key = url.searchParams.get("key") || "";
      if (!key.startsWith(BACKUP_PREFIX) || key.includes("..")) return json({ status: "error", error: "invalid backup key" }, 400);
      const object = await env.MEDIA.get(key);
      if (!object) return json({ status: "error", error: "backup object not found" }, 404);
      const headers = new Headers();
      headers.set("content-type", "application/octet-stream");
      headers.set("content-length", String(object.size));
      headers.set("cache-control", "private, no-store");
      headers.set("x-content-type-options", "nosniff");
      headers.set("x-aipt-backup-etag", object.etag);
      return new Response(object.body, { status: 200, headers });
    }

    return json({ status: "error", error: "unsupported export mode" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "export failed";
    return json({ status: "error", error: message }, 401);
  }
};

export const onRequestGet: PagesFunction = async () => json({ error: "Not found" }, 404);
