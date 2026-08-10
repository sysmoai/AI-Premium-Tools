interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  AIPT_MEDIA_TEST_NONCE?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}

function authorized(request: Request, env: Env): boolean {
  const expected = env.AIPT_MEDIA_TEST_NONCE?.trim();
  const header = request.headers.get("authorization")?.trim() ?? "";
  return Boolean(expected && header === `Bearer ${expected}`);
}

interface CleanupItem {
  id: number;
  key: string;
}

const DISPOSABLE_PREFIX = "aipt-ci-disposable-";
const DISPOSABLE_ALT = "AIPT disposable media verification";

async function verifyItem(env: Env, item: CleanupItem): Promise<{ id: number; key: string }> {
  const id = Number(item.id);
  const key = String(item.key ?? "");
  if (!Number.isInteger(id) || id <= 0 || !key.startsWith("library/")) {
    throw new Response(JSON.stringify({ error: "Invalid cleanup item" }), { status: 400 });
  }

  const row = await env.DB.prepare(
    `SELECT id, r2_key, original_filename, alt_text,
            (SELECT COUNT(*) FROM product_media pm WHERE pm.media_asset_id = media_assets.id) AS usage_count
     FROM media_assets WHERE id = ?`,
  )
    .bind(id)
    .first<Record<string, unknown>>();

  if (!row) throw new Response(JSON.stringify({ error: `Media row ${id} not found` }), { status: 404 });
  if (String(row.r2_key) !== key) throw new Response(JSON.stringify({ error: `Media row ${id} key mismatch` }), { status: 409 });
  if (!String(row.original_filename ?? "").startsWith(DISPOSABLE_PREFIX)) {
    throw new Response(JSON.stringify({ error: `Media row ${id} is not a disposable CI asset` }), { status: 409 });
  }
  if (String(row.alt_text ?? "") !== DISPOSABLE_ALT) {
    throw new Response(JSON.stringify({ error: `Media row ${id} disposable marker mismatch` }), { status: 409 });
  }
  if (Number(row.usage_count ?? 0) !== 0) {
    throw new Response(JSON.stringify({ error: `Media row ${id} is attached to a product and will not be deleted` }), { status: 409 });
  }
  return { id, key };
}

async function deleteAndVerify(env: Env, verified: Array<{ id: number; key: string }>) {
  for (const item of verified) await env.MEDIA.delete(item.key);
  for (const item of verified) {
    await env.DB.prepare("DELETE FROM media_assets WHERE id = ? AND r2_key = ?").bind(item.id, item.key).run();
  }

  const remaining: number[] = [];
  for (const item of verified) {
    const row = await env.DB.prepare("SELECT id FROM media_assets WHERE id = ?").bind(item.id).first();
    if (row) remaining.push(item.id);
    const object = await env.MEDIA.head(item.key);
    if (object) remaining.push(item.id);
  }
  if (remaining.length > 0) return { ok: false as const, remaining };
  return { ok: true as const };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);

  let body: { action?: string; items?: CleanupItem[] };
  try {
    body = await request.json<{ action?: string; items?: CleanupItem[] }>();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "sweep") {
    const rows = await env.DB.prepare(
      `SELECT id, r2_key, original_filename, alt_text,
              (SELECT COUNT(*) FROM product_media pm WHERE pm.media_asset_id = media_assets.id) AS usage_count
       FROM media_assets
       WHERE original_filename LIKE ? AND alt_text = ?
       ORDER BY id ASC
       LIMIT 20`,
    )
      .bind(`${DISPOSABLE_PREFIX}%`, DISPOSABLE_ALT)
      .all<Record<string, unknown>>();

    const candidates = (rows.results ?? []).map((row) => ({
      id: Number(row.id),
      key: String(row.r2_key),
      usage_count: Number(row.usage_count ?? 0),
    }));
    if (candidates.some((item) => item.usage_count !== 0)) {
      return json({ error: "Disposable marker matched media attached to a product; refusing sweep" }, 409);
    }
    const verified: Array<{ id: number; key: string }> = [];
    for (const candidate of candidates) verified.push(await verifyItem(env, candidate));
    const result = await deleteAndVerify(env, verified);
    if (!result.ok) return json({ error: "Disposable media sweep verification failed", remaining: result.remaining }, 500);
    return json({ ok: true, swept: verified.length, deleted: verified.map((item) => item.id) });
  }

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 4) {
    return json({ error: "Expected 1-4 cleanup items" }, 400);
  }

  const verified: Array<{ id: number; key: string }> = [];
  try {
    for (const item of body.items) verified.push(await verifyItem(env, item));
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  const result = await deleteAndVerify(env, verified);
  if (!result.ok) return json({ error: "Disposable media cleanup verification failed", remaining: result.remaining }, 500);
  return json({ ok: true, deleted: verified.map((item) => item.id) });
};
