interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  AIPT_PRODUCT_MEDIA_TEST_NONCE?: string;
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
  const expected = env.AIPT_PRODUCT_MEDIA_TEST_NONCE?.trim();
  const header = request.headers.get("authorization")?.trim() ?? "";
  return Boolean(expected && header === `Bearer ${expected}`);
}

interface Item {
  id: number;
  key: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);

  let body: { items?: Item[] };
  try {
    body = await request.json<{ items?: Item[] }>();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 4) {
    return json({ error: "Expected 1-4 cleanup items" }, 400);
  }

  const verified: Item[] = [];
  for (const raw of body.items) {
    const id = Number(raw.id);
    const key = String(raw.key || "");
    if (!Number.isInteger(id) || id <= 0 || !key.startsWith("library/")) {
      return json({ error: "Invalid cleanup item" }, 400);
    }
    const row = await env.DB.prepare(
      `SELECT id, r2_key, original_filename, alt_text,
              (SELECT COUNT(*) FROM product_media pm WHERE pm.media_asset_id = media_assets.id) AS usage_count
       FROM media_assets WHERE id = ?`,
    )
      .bind(id)
      .first<Record<string, unknown>>();
    if (!row) return json({ error: `Media row ${id} not found` }, 404);
    if (String(row.r2_key) !== key) return json({ error: `Media row ${id} key mismatch` }, 409);
    if (!String(row.original_filename ?? "").startsWith("aipt-product-media-ci-")) {
      return json({ error: `Media row ${id} is not a disposable relationship-test asset` }, 409);
    }
    if (String(row.alt_text ?? "") !== "AIPT disposable product media verification") {
      return json({ error: `Media row ${id} marker mismatch` }, 409);
    }
    if (Number(row.usage_count ?? 0) !== 0) {
      return json({ error: `Media row ${id} is still attached to a product` }, 409);
    }
    verified.push({ id, key });
  }

  for (const item of verified) await env.MEDIA.delete(item.key);
  for (const item of verified) {
    await env.DB.prepare("DELETE FROM media_assets WHERE id = ? AND r2_key = ?").bind(item.id, item.key).run();
  }

  for (const item of verified) {
    const row = await env.DB.prepare("SELECT id FROM media_assets WHERE id = ?").bind(item.id).first();
    if (row) return json({ error: `D1 row ${item.id} remains after cleanup` }, 500);
    if (await env.MEDIA.head(item.key)) return json({ error: `R2 object ${item.id} remains after cleanup` }, 500);
  }

  return json({ ok: true, deleted: verified.map((item) => item.id) });
};
