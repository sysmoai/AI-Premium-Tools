import { requireAdmin } from "../../../lib/admin-auth";

interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
}

const ROLES = new Set([
  "logo",
  "primary",
  "gallery",
  "thumbnail",
  "hero",
  "video",
  "poster",
  "documentation",
]);

interface ProductMediaInput {
  media_asset_id: number;
  role?: string;
  sort_order?: number;
  is_primary?: boolean;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function productIdFromParams(params: Record<string, string | string[]>): number | null {
  const raw = params.id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listProductMedia(db: D1Database, productId: number) {
  const rows = await db.prepare(
    `SELECT
       pm.id AS relation_id,
       pm.product_id,
       pm.media_asset_id,
       pm.role,
       pm.sort_order,
       pm.is_primary,
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
       m.poster_asset_id
     FROM product_media pm
     JOIN media_assets m ON m.id = pm.media_asset_id
     WHERE pm.product_id = ? AND m.status = 'active'
     ORDER BY pm.is_primary DESC, pm.sort_order ASC, pm.id ASC`,
  )
    .bind(productId)
    .all<Record<string, unknown>>();

  return (rows.results ?? []).map((row) => ({
    relation_id: Number(row.relation_id),
    product_id: Number(row.product_id),
    media_asset_id: Number(row.media_asset_id),
    role: String(row.role),
    sort_order: Number(row.sort_order ?? 0),
    is_primary: Boolean(row.is_primary),
    key: String(row.r2_key),
    url: `/media/${String(row.r2_key)}`,
    asset_type: String(row.asset_type),
    mime_type: String(row.mime_type),
    original_filename: row.original_filename,
    size_bytes: Number(row.size_bytes ?? 0),
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    duration_ms: row.duration_ms == null ? null : Number(row.duration_ms),
    alt_text: row.alt_text,
    caption: row.caption,
    poster_asset_id: row.poster_asset_id == null ? null : Number(row.poster_asset_id),
  }));
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const productId = productIdFromParams(params);
  if (!productId) return json({ error: "Invalid product id" }, 400);

  const product = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(productId).first();
  if (!product) return json({ error: "Product not found" }, 404);

  return json({ items: await listProductMedia(env.DB, productId) });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const productId = productIdFromParams(params);
  if (!productId) return json({ error: "Invalid product id" }, 400);

  const product = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(productId).first();
  if (!product) return json({ error: "Product not found" }, 404);

  let body: { items?: ProductMediaInput[] };
  try {
    body = await request.json<{ items?: ProductMediaInput[] }>();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!Array.isArray(body.items)) return json({ error: "items must be an array" }, 400);
  if (body.items.length > 24) return json({ error: "A product can have at most 24 media attachments" }, 400);

  const normalized = body.items.map((item, index) => ({
    media_asset_id: Number(item.media_asset_id),
    role: (item.role || "gallery").trim(),
    sort_order: Number.isFinite(Number(item.sort_order)) ? Math.trunc(Number(item.sort_order)) : index,
    is_primary: Boolean(item.is_primary),
  }));

  const seen = new Set<string>();
  for (const item of normalized) {
    if (!Number.isInteger(item.media_asset_id) || item.media_asset_id <= 0) {
      return json({ error: "Every media_asset_id must be a positive integer" }, 400);
    }
    if (!ROLES.has(item.role)) return json({ error: `Unsupported media role: ${item.role}` }, 400);
    const key = `${item.media_asset_id}:${item.role}`;
    if (seen.has(key)) return json({ error: "Duplicate media attachment" }, 400);
    seen.add(key);
  }

  if (normalized.filter((item) => item.is_primary).length > 1) {
    return json({ error: "Only one media attachment can be primary" }, 400);
  }

  let assets = new Map<number, { asset_type: string; r2_key: string }>();
  if (normalized.length > 0) {
    const ids = [...new Set(normalized.map((item) => item.media_asset_id))];
    const placeholders = ids.map(() => "?").join(",");
    const result = await env.DB.prepare(
      `SELECT id, asset_type, r2_key FROM media_assets WHERE status = 'active' AND id IN (${placeholders})`,
    )
      .bind(...ids)
      .all<Record<string, unknown>>();
    assets = new Map(
      (result.results ?? []).map((row) => [
        Number(row.id),
        { asset_type: String(row.asset_type), r2_key: String(row.r2_key) },
      ]),
    );
    if (assets.size !== ids.length) return json({ error: "One or more media assets do not exist or are inactive" }, 400);
  }

  const primary = normalized.find((item) => item.is_primary);
  if (primary && assets.get(primary.media_asset_id)?.asset_type !== "image") {
    return json({ error: "Primary product media must be an image" }, 400);
  }

  const statements: D1PreparedStatement[] = [
    env.DB.prepare("DELETE FROM product_media WHERE product_id = ?").bind(productId),
  ];

  for (const item of normalized) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO product_media (product_id, media_asset_id, role, sort_order, is_primary)
         VALUES (?, ?, ?, ?, ?)`,
      ).bind(productId, item.media_asset_id, item.role, item.sort_order, item.is_primary ? 1 : 0),
    );
  }

  if (primary) {
    const key = assets.get(primary.media_asset_id)!.r2_key;
    statements.push(
      env.DB.prepare("UPDATE products SET image_url = ?, updated_at = ? WHERE id = ?").bind(
        `/media/${key}`,
        Date.now(),
        productId,
      ),
    );
  }

  await env.DB.batch(statements);
  return json({ items: await listProductMedia(env.DB, productId) });
};
