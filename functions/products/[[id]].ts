interface Env {
  DB: D1Database;
}

const PRODUCT_PATH = /^\/products\/(\d+)\/?$/;

/**
 * Preserve the SPA for valid product detail URLs while returning an actual
 * HTTP 404 for product IDs that do not exist. This prevents Cloudflare Pages'
 * catch-all SPA fallback from turning missing products into soft 404s.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    return context.next();
  }

  const url = new URL(context.request.url);
  const match = PRODUCT_PATH.exec(url.pathname);
  if (!match) return context.next();

  const id = Number(match[1]);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return new Response("Product not found", { status: 404 });
  }

  const product = await context.env.DB.prepare(
    "SELECT 1 FROM products WHERE id = ? AND is_active = 1 LIMIT 1",
  )
    .bind(id)
    .first();

  if (!product) {
    return new Response("Product not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return context.next();
};
