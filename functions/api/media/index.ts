import { requireAdmin } from "../../lib/admin-auth";

interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function asInt(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = asInt(url.searchParams.get("limit"), 60, 1, 100);
  const offset = asInt(url.searchParams.get("offset"), 0, 0, 1000000);
  const type = url.searchParams.get("type")?.trim();
  const search = url.searchParams.get("search")?.trim();

  const where = ["m.status != 'deleted'"];
  const params: unknown[] = [];

  if (type === "image" || type === "video" || type === "document" || type === "other") {
    where.push("m.asset_type = ?");
    params.push(type);
  }
  if (search) {
    where.push("(m.original_filename LIKE ? OR m.alt_text LIKE ? OR m.caption LIKE ?)");
    const pattern = `%${search.slice(0, 100)}%`;
    params.push(pattern, pattern, pattern);
  }

  const rows = await env.DB.prepare(
    `SELECT
       m.id,
       m.r2_key,
       m.asset_type,
       m.mime_type,
       m.original_filename,
       m.size_bytes,
       m.width,
       m.height,
       m.duration_ms,
       m.alt_text,
       m.caption,
       m.poster_asset_id,
       m.status,
       m.created_at,
       m.updated_at,
       COUNT(pm.id) AS usage_count
     FROM media_assets m
     LEFT JOIN product_media pm ON pm.media_asset_id = m.id
     WHERE ${where.join(" AND ")}
     GROUP BY m.id
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...params, limit, offset)
    .all<Record<string, unknown>>();

  const items = (rows.results ?? []).map((row) => ({
    id: Number(row.id),
    key: String(row.r2_key),
    url: `/media/${String(row.r2_key)}`,
    asset_type: row.asset_type,
    mime_type: row.mime_type,
    original_filename: row.original_filename,
    size_bytes: Number(row.size_bytes ?? 0),
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    duration_ms: row.duration_ms == null ? null : Number(row.duration_ms),
    alt_text: row.alt_text,
    caption: row.caption,
    poster_asset_id: row.poster_asset_id == null ? null : Number(row.poster_asset_id),
    status: row.status,
    usage_count: Number(row.usage_count ?? 0),
    created_at: row.created_at == null ? null : new Date(Number(row.created_at)).toISOString(),
    updated_at: row.updated_at == null ? null : new Date(Number(row.updated_at)).toISOString(),
  }));

  return json({ items, limit, offset });
};
