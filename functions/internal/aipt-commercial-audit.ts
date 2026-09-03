interface Env {
  DB: D1Database;
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

const OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const OIDC_AUDIENCE = "aipt-commercial-audit";
const REPOSITORY = "sysmoai/AI-Premium-Tools";
const REPOSITORY_ID = "1239441399";
const WORKFLOW_REF = `${REPOSITORY}/.github/workflows/aipt-commercial-inventory-audit.yml@refs/heads/main`;
const ALLOWED_STATES = new Set(["CUSTOMER_OWNED", "AUTHORIZED_SEAT", "HOLD", "PROHIBITED"]);
const encoder = new TextEncoder();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
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

async function verifyGithubOidc(request: Request): Promise<void> {
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
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && (!key.alg || key.alg === "RS256"));
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
  if (payload.workflow_ref !== WORKFLOW_REF || payload.job_workflow_ref !== WORKFLOW_REF) throw new Error("invalid workflow identity");
  if (!["workflow_dispatch", "workflow_run"].includes(payload.event_name || "")) throw new Error("invalid event");
}

type ProductRow = {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  sku: string | null;
  slug: string | null;
  plan_type: string | null;
  delivery_type: string | null;
  commercial_state: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_index: number;
  is_active: number;
  media_count: number;
};

function present(value: unknown): boolean {
  return value != null && String(value).trim().length > 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    await verifyGithubOidc(request);
    const result = await env.DB.prepare(
      `SELECT p.id, p.name, p.description, p.short_description, p.sku, p.slug,
              p.plan_type, p.delivery_type, p.commercial_state, p.seo_title,
              p.seo_description, p.seo_index, p.is_active,
              (SELECT COUNT(*) FROM product_media pm WHERE pm.product_id = p.id) AS media_count
       FROM products p
       ORDER BY p.id ASC`,
    ).all<ProductRow>();

    const rows = (result.results || []).map((row) => {
      const fields = {
        description: present(row.description),
        short_description: present(row.short_description),
        sku: present(row.sku),
        slug: present(row.slug),
        plan_type: present(row.plan_type),
        delivery_type: present(row.delivery_type),
        seo_title: present(row.seo_title),
        seo_description: present(row.seo_description),
        media: Number(row.media_count || 0) > 0,
      };
      const completeCount = Object.values(fields).filter(Boolean).length;
      return {
        id: Number(row.id),
        name: String(row.name || ""),
        sku: row.sku == null ? null : String(row.sku),
        slug: row.slug == null ? null : String(row.slug),
        plan_type: row.plan_type == null ? null : String(row.plan_type),
        delivery_type: row.delivery_type == null ? null : String(row.delivery_type),
        commercial_state: String(row.commercial_state || "").toUpperCase(),
        seo_index: Number(row.seo_index),
        is_active: Number(row.is_active),
        media_count: Number(row.media_count || 0),
        completeness: {
          fields,
          score: Math.round((completeCount / Object.keys(fields).length) * 100),
          missing: Object.entries(fields).filter(([, ok]) => !ok).map(([key]) => key),
        },
      };
    });

    const invalid = rows.filter((row) => !Number.isInteger(row.id) || !row.name || !ALLOWED_STATES.has(row.commercial_state));
    if (invalid.length) return json({ status: "error", error: "invalid commercial-state data", invalid_count: invalid.length }, 500);

    const active = rows.filter((row) => row.is_active !== 0);
    const counts = Object.fromEntries([...ALLOWED_STATES].map((state) => [state, active.filter((row) => row.commercial_state === state).length]));
    const scoreDistribution = {
      complete_100: active.filter((row) => row.completeness.score === 100).length,
      incomplete: active.filter((row) => row.completeness.score < 100).length,
    };
    return json({
      status: "ok",
      captured_at: new Date().toISOString(),
      catalog_only: true,
      total_products: rows.length,
      active_products: active.length,
      commercial_state_counts: counts,
      completeness_counts: scoreDistribution,
      rows: active,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "commercial audit failed";
    return json({ status: "error", error: message }, 401);
  }
};

export const onRequestGet: PagesFunction = async () => json({ error: "Not found" }, 404);
