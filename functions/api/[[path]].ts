// Cloudflare Pages Function — production API for the AIPT store, backed by
// D1. Mirrors artifacts/api-server's Express routes (see openapi.yaml for
// the contract) since that server only runs in local dev against Postgres.
// Local dev and production intentionally use different databases; keep
// route behavior in sync by hand when either changes.
import { createHmac, timingSafeEqual } from "node:crypto";

interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorJson(message: string, status: number): Response {
  return json({ error: message }, status);
}

// ─── Admin auth (mirrors artifacts/api-server/src/middlewares/admin-auth.ts) ───

function mintAdminToken(env: Env): string {
  const secret = env.SESSION_SECRET || "fallback-dev-secret";
  return createHmac("sha256", secret).update("aipt:admin:v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function isAdmin(request: Request, env: Env): boolean {
  const header = request.headers.get("authorization");
  const match = header ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  const token = match ? match[1].trim() : null;
  return !!token && safeEqual(token, mintAdminToken(env));
}

function requireAdmin(request: Request, env: Env): Response | null {
  if (!isAdmin(request, env)) return errorJson("Unauthorized", 401);
  return null;
}

// ─── Row transforms ─────────────────────────────────────────────────────────

function toProduct(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    price_bdt: Number(r.price_bdt),
    original_price_bdt: r.original_price_bdt != null ? Number(r.original_price_bdt) : undefined,
    category_id: r.category_id,
    category_name: r.category_name ?? undefined,
    image_url: r.image_url ?? undefined,
    features: r.features ? JSON.parse(r.features as string) : undefined,
    duration_days: r.duration_days,
    is_active: !!r.is_active,
    is_featured: !!r.is_featured,
    stock_count: r.stock_count,
    order_count: r.order_count,
    created_at: new Date(r.created_at as number).toISOString(),
  };
}

function toCategory(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? undefined,
    icon: r.icon ?? undefined,
    product_count: Number(r.product_count ?? 0),
  };
}

function toCustomer(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? undefined,
    university: r.university ?? undefined,
    order_count: Number(r.order_count ?? 0),
    total_spent_bdt: Number(r.total_spent_bdt ?? 0),
    created_at: new Date(r.created_at as number).toISOString(),
  };
}

function toReview(r: Record<string, unknown>) {
  return {
    id: r.id,
    product_id: r.product_id,
    customer_name: r.customer_name,
    rating: r.rating,
    title: r.title ?? undefined,
    body: r.body,
    verified: r.order_id !== null,
    created_at: new Date(r.created_at as number).toISOString(),
  };
}

function digitsOnly(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

async function loadOrder(db: D1Database, id: number) {
  const order = await db
    .prepare(
      `SELECT o.id, o.customer_id, c.name as customer_name, c.phone as customer_phone,
              o.status, o.total_bdt, o.payment_method, o.payment_ref, o.notes,
              o.created_at, o.updated_at
       FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ?`,
    )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!order) return null;

  const items = await db
    .prepare(
      `SELECT oi.id, oi.order_id, oi.product_id, p.name as product_name, oi.quantity, oi.unit_price_bdt
       FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
    )
    .bind(id)
    .all<Record<string, unknown>>();

  return {
    id: order.id,
    customer_id: order.customer_id,
    customer_name: order.customer_name ?? undefined,
    customer_phone: order.customer_phone ?? undefined,
    status: order.status,
    total_bdt: Number(order.total_bdt),
    payment_method: order.payment_method,
    payment_ref: order.payment_ref ?? undefined,
    notes: order.notes ?? undefined,
    items: (items.results ?? []).map(i => ({
      id: i.id,
      order_id: i.order_id,
      product_id: i.product_id,
      product_name: i.product_name ?? undefined,
      quantity: i.quantity,
      unit_price_bdt: Number(i.unit_price_bdt),
    })),
    created_at: new Date(order.created_at as number).toISOString(),
    updated_at: new Date(order.updated_at as number).toISOString(),
  };
}

function stripPii<T extends { customer_phone?: unknown; payment_ref?: unknown; notes?: unknown }>(order: T) {
  const { customer_phone: _p, payment_ref: _r, notes: _n, ...safe } = order;
  return safe;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const method = request.method;

  try {
    // health
    if (path === "/healthz" && method === "GET") return json({ status: "ok" });

    // categories
    if (path === "/categories" && method === "GET") {
      const rows = await db
        .prepare(
          `SELECT c.id, c.name, c.slug, c.description, c.icon, COUNT(p.id) as product_count
           FROM categories c LEFT JOIN products p ON p.category_id = c.id
           GROUP BY c.id ORDER BY c.id`,
        )
        .all<Record<string, unknown>>();
      return json((rows.results ?? []).map(toCategory));
    }

    // products list
    if (path === "/products" && method === "GET") {
      const conditions: string[] = [];
      const params: unknown[] = [];
      const categoryId = url.searchParams.get("category_id");
      const search = url.searchParams.get("search");
      const featured = url.searchParams.get("featured");
      const isActive = url.searchParams.get("is_active");
      if (categoryId) { conditions.push("p.category_id = ?"); params.push(Number(categoryId)); }
      if (featured !== null) { conditions.push("p.is_featured = ?"); params.push(featured === "true" ? 1 : 0); }
      if (isActive !== null) { conditions.push("p.is_active = ?"); params.push(isActive === "true" ? 1 : 0); }
      if (search) { conditions.push("p.name LIKE ?"); params.push(`%${search}%`); }
      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const rows = await db
        .prepare(
          `SELECT p.*, c.name as category_name FROM products p
           LEFT JOIN categories c ON c.id = p.category_id ${where} ORDER BY p.category_id, p.id`,
        )
        .bind(...params)
        .all<Record<string, unknown>>();
      return json((rows.results ?? []).map(toProduct));
    }

    // product detail: /products/:id or /products/:id/reviews
    const productMatch = /^\/products\/(\d+)(\/reviews)?$/.exec(path);
    if (productMatch) {
      const id = Number(productMatch[1]);
      const isReviews = !!productMatch[2];

      if (isReviews && method === "GET") {
        const rows = await db
          .prepare(
            `SELECT id, product_id, customer_name, rating, title, body, order_id, created_at
             FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC`,
          )
          .bind(id)
          .all<Record<string, unknown>>();
        return json((rows.results ?? []).map(toReview));
      }

      if (!isReviews && method === "GET") {
        const row = await db
          .prepare(
            `SELECT p.*, c.name as category_name FROM products p
             LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
          )
          .bind(id)
          .first<Record<string, unknown>>();
        if (!row) return errorJson("Not found", 404);
        return json(toProduct(row));
      }

      if (!isReviews && method === "PUT") {
        const denied = requireAdmin(request, env);
        if (denied) return denied;
        const body = await request.json<Record<string, unknown>>();
        const sets: string[] = [];
        const params: unknown[] = [];
        const map: Record<string, string> = {
          name: "name", description: "description", price_bdt: "price_bdt",
          original_price_bdt: "original_price_bdt", category_id: "category_id",
          image_url: "image_url", duration_days: "duration_days",
          is_active: "is_active", is_featured: "is_featured", stock_count: "stock_count",
        };
        for (const [key, col] of Object.entries(map)) {
          if (body[key] !== undefined) {
            sets.push(`${col} = ?`);
            params.push(key === "is_active" || key === "is_featured" ? (body[key] ? 1 : 0) : body[key]);
          }
        }
        if (body.features !== undefined) { sets.push("features = ?"); params.push(JSON.stringify(body.features)); }
        if (sets.length) {
          params.push(id);
          await db.prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run();
        }
        const row = await db
          .prepare(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`)
          .bind(id).first<Record<string, unknown>>();
        if (!row) return errorJson("Not found", 404);
        return json(toProduct(row));
      }
    }

    // categories create (admin)
    if (path === "/products" && method === "POST") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const b = await request.json<Record<string, unknown>>();
      const result = await db
        .prepare(
          `INSERT INTO products (name, description, price_bdt, original_price_bdt, category_id, image_url, features, duration_days, is_active, is_featured, stock_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          b.name, b.description ?? null, b.price_bdt, b.original_price_bdt ?? null, b.category_id,
          b.image_url ?? null, b.features ? JSON.stringify(b.features) : null, b.duration_days ?? 30,
          b.is_active === false ? 0 : 1, b.is_featured ? 1 : 0, b.stock_count ?? 100,
        )
        .run();
      const id = result.meta.last_row_id;
      const row = await db
        .prepare(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`)
        .bind(id).first<Record<string, unknown>>();
      return json(toProduct(row!), 201);
    }

    // reviews create
    if (path === "/reviews" && method === "POST") {
      const b = await request.json<Record<string, unknown>>();
      const body = String(b.body ?? "").replace(/<[^>]*>/g, "").trim();
      const name = String(b.customer_name ?? "").replace(/<[^>]*>/g, "").trim();
      if (body.length < 10 || body.length > 2000) return errorJson("Review body must be 10–2000 characters", 400);
      if (name.length < 1 || name.length > 120) return errorJson("Name must be 1–120 characters", 400);

      let verifiedOrderId: number | null = null;
      if (b.order_id && b.customer_phone) {
        const match = await db
          .prepare(
            `SELECT o.id FROM orders o
             JOIN customers c ON c.id = o.customer_id
             JOIN order_items oi ON oi.order_id = o.id
             WHERE o.id = ? AND c.phone = ? AND oi.product_id = ? LIMIT 1`,
          )
          .bind(b.order_id, b.customer_phone, b.product_id)
          .first<{ id: number }>();
        if (match) verifiedOrderId = match.id;
      }
      const result = await db
        .prepare(
          `INSERT INTO reviews (product_id, order_id, customer_name, customer_phone, rating, title, body, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        )
        .bind(b.product_id, verifiedOrderId, name, b.customer_phone ?? null, b.rating, b.title ?? null, body)
        .run();
      return json({ id: result.meta.last_row_id, status: "pending" }, 201);
    }

    // customers
    if (path === "/customers" && method === "POST") {
      const b = await request.json<Record<string, unknown>>();
      const existing = await db.prepare(`SELECT * FROM customers WHERE phone = ?`).bind(b.phone).first<Record<string, unknown>>();
      if (existing) return json(toCustomer({ ...existing, order_count: 0, total_spent_bdt: 0 }), 201);
      const result = await db
        .prepare(`INSERT INTO customers (name, phone, email, university) VALUES (?, ?, ?, ?)`)
        .bind(b.name, b.phone, b.email ?? null, b.university ?? null)
        .run();
      const row = await db.prepare(`SELECT * FROM customers WHERE id = ?`).bind(result.meta.last_row_id).first<Record<string, unknown>>();
      return json(toCustomer({ ...row!, order_count: 0, total_spent_bdt: 0 }), 201);
    }

    if (path === "/customers" && method === "GET") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const rows = await db
        .prepare(
          `SELECT c.*, COUNT(o.id) as order_count, COALESCE(SUM(o.total_bdt), 0) as total_spent_bdt
           FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id`,
        )
        .all<Record<string, unknown>>();
      return json((rows.results ?? []).map(toCustomer));
    }

    const customerMatch = /^\/customers\/(\d+)$/.exec(path);
    if (customerMatch && method === "GET") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const row = await db
        .prepare(
          `SELECT c.*, COUNT(o.id) as order_count, COALESCE(SUM(o.total_bdt), 0) as total_spent_bdt
           FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE c.id = ? GROUP BY c.id`,
        )
        .bind(Number(customerMatch[1]))
        .first<Record<string, unknown>>();
      if (!row) return errorJson("Not found", 404);
      return json(toCustomer(row));
    }

    // orders
    if (path === "/orders" && method === "POST") {
      const b = await request.json<{ customer_id: number; payment_method: string; payment_ref?: string; notes?: string; items: { product_id: number; quantity: number }[] }>();
      if (!b.items || b.items.length === 0) return errorJson("Order must contain at least one item", 400);

      let total = 0;
      const enriched: { productId: number; quantity: number; unitPrice: number }[] = [];
      for (const item of b.items) {
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
          return errorJson(`Invalid quantity for product ${item.product_id}`, 400);
        }
        const product = await db
          .prepare(`SELECT price_bdt, is_active FROM products WHERE id = ?`)
          .bind(item.product_id)
          .first<{ price_bdt: number; is_active: number }>();
        if (!product || !product.is_active) return errorJson(`Product ${item.product_id} not available`, 400);
        total += Number(product.price_bdt) * item.quantity;
        enriched.push({ productId: item.product_id, quantity: item.quantity, unitPrice: Number(product.price_bdt) });
      }

      const orderResult = await db
        .prepare(`INSERT INTO orders (customer_id, status, total_bdt, payment_method, payment_ref, notes) VALUES (?, 'pending', ?, ?, ?, ?)`)
        .bind(b.customer_id, total, b.payment_method, b.payment_ref ?? null, b.notes ?? null)
        .run();
      const orderId = orderResult.meta.last_row_id;

      for (const item of enriched) {
        await db
          .prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price_bdt) VALUES (?, ?, ?, ?)`)
          .bind(orderId, item.productId, item.quantity, item.unitPrice)
          .run();
        await db.prepare(`UPDATE products SET order_count = order_count + ? WHERE id = ?`).bind(item.quantity, item.productId).run();
      }

      const result = await loadOrder(db, orderId as number);
      return json(result, 201);
    }

    if (path === "/orders" && method === "GET") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const conditions: string[] = [];
      const params: unknown[] = [];
      const status = url.searchParams.get("status");
      const customerId = url.searchParams.get("customer_id");
      if (status) { conditions.push("o.status = ?"); params.push(status); }
      if (customerId) { conditions.push("o.customer_id = ?"); params.push(Number(customerId)); }
      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const rows = await db
        .prepare(
          `SELECT o.id, o.customer_id, c.name as customer_name, c.phone as customer_phone,
                  o.status, o.total_bdt, o.payment_method, o.payment_ref, o.notes, o.created_at, o.updated_at
           FROM orders o LEFT JOIN customers c ON c.id = o.customer_id ${where} ORDER BY o.created_at DESC`,
        )
        .bind(...params)
        .all<Record<string, unknown>>();
      return json((rows.results ?? []).map(o => ({
        id: o.id, customer_id: o.customer_id, customer_name: o.customer_name ?? undefined,
        customer_phone: o.customer_phone ?? undefined, status: o.status, total_bdt: Number(o.total_bdt),
        payment_method: o.payment_method, payment_ref: o.payment_ref ?? undefined, notes: o.notes ?? undefined,
        items: [], created_at: new Date(o.created_at as number).toISOString(), updated_at: new Date(o.updated_at as number).toISOString(),
      })));
    }

    const orderStatusMatch = /^\/orders\/(\d+)\/status$/.exec(path);
    if (orderStatusMatch && method === "PATCH") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const id = Number(orderStatusMatch[1]);
      const b = await request.json<{ status: string }>();
      if (!["pending", "confirmed", "delivered", "cancelled"].includes(b.status)) return errorJson("Invalid status", 400);
      await db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).bind(b.status, Date.now(), id).run();
      const result = await loadOrder(db, id);
      if (!result) return errorJson("Not found", 404);
      return json(result);
    }

    const orderMatch = /^\/orders\/(\d+)$/.exec(path);
    if (orderMatch && method === "GET") {
      const id = Number(orderMatch[1]);
      const order = await loadOrder(db, id);
      if (!order) return errorJson("Not found", 404);
      if (isAdmin(request, env)) return json(order);
      const provided = digitsOnly(url.searchParams.get("phone"));
      const stored = digitsOnly(order.customer_phone as string | undefined);
      if (!provided || !stored || provided !== stored) return errorJson("Not found", 404);
      return json(stripPii(order));
    }

    // admin login
    if (path === "/admin/login" && method === "POST") {
      const b = await request.json<{ password?: string }>();
      const expected = env.ADMIN_PASSWORD || "aipt2024";
      if (b.password !== expected) return errorJson("Invalid password", 401);
      return json({ token: mintAdminToken(env) });
    }

    // stats
    if (path === "/stats/dashboard" && method === "GET") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const delivered = await db.prepare(`SELECT COALESCE(SUM(total_bdt),0) as total, COUNT(*) as count FROM orders WHERE status = 'delivered'`).first<{ total: number; count: number }>();
      const pending = await db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`).first<{ count: number }>();
      const confirmed = await db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'`).first<{ count: number }>();
      const cancelled = await db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'`).first<{ count: number }>();
      const customers = await db.prepare(`SELECT COUNT(*) as count FROM customers`).first<{ count: number }>();
      const products = await db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`).first<{ count: number }>();
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const monthly = await db.prepare(`SELECT COALESCE(SUM(total_bdt),0) as total FROM orders WHERE created_at >= ?`).bind(startOfMonth.getTime()).first<{ total: number }>();
      return json({
        total_revenue_bdt: delivered?.total ?? 0,
        total_orders: (delivered?.count ?? 0) + (pending?.count ?? 0) + (confirmed?.count ?? 0) + (cancelled?.count ?? 0),
        total_customers: customers?.count ?? 0,
        total_products: products?.count ?? 0,
        pending_orders: pending?.count ?? 0,
        delivered_orders: delivered?.count ?? 0,
        cancelled_orders: cancelled?.count ?? 0,
        monthly_revenue_bdt: monthly?.total ?? 0,
      });
    }

    if (path === "/stats/recent-orders" && method === "GET") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const limit = Number(url.searchParams.get("limit") ?? 10);
      const rows = await db
        .prepare(
          `SELECT o.id, o.customer_id, c.name as customer_name, c.phone as customer_phone,
                  o.status, o.total_bdt, o.payment_method, o.payment_ref, o.notes, o.created_at, o.updated_at
           FROM orders o LEFT JOIN customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT ?`,
        )
        .bind(limit)
        .all<Record<string, unknown>>();
      return json((rows.results ?? []).map(o => ({
        id: o.id, customer_id: o.customer_id, customer_name: o.customer_name ?? undefined,
        customer_phone: o.customer_phone ?? undefined, status: o.status, total_bdt: Number(o.total_bdt),
        payment_method: o.payment_method, payment_ref: o.payment_ref ?? undefined, notes: o.notes ?? undefined,
        items: [], created_at: new Date(o.created_at as number).toISOString(), updated_at: new Date(o.updated_at as number).toISOString(),
      })));
    }

    if (path === "/stats/top-products" && method === "GET") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const limit = Number(url.searchParams.get("limit") ?? 5);
      const rows = await db
        .prepare(`SELECT p.* FROM products p ORDER BY p.order_count DESC LIMIT ?`)
        .bind(limit)
        .all<Record<string, unknown>>();
      return json((rows.results ?? []).map(toProduct));
    }

    // categories admin create/update/delete
    if (path === "/categories" && method === "POST") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const b = await request.json<Record<string, unknown>>();
      const result = await db
        .prepare(`INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)`)
        .bind(b.name, b.slug, b.description ?? null, b.icon ?? null)
        .run();
      const row = await db.prepare(`SELECT * FROM categories WHERE id = ?`).bind(result.meta.last_row_id).first<Record<string, unknown>>();
      return json(toCategory({ ...row!, product_count: 0 }), 201);
    }

    const categoryMatch = /^\/categories\/(\d+)$/.exec(path);
    if (categoryMatch && method === "PUT") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const id = Number(categoryMatch[1]);
      const b = await request.json<Record<string, unknown>>();
      const sets: string[] = [];
      const params: unknown[] = [];
      for (const key of ["name", "slug", "description", "icon"]) {
        if (b[key] !== undefined) { sets.push(`${key} = ?`); params.push(b[key]); }
      }
      if (sets.length) { params.push(id); await db.prepare(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run(); }
      const row = await db.prepare(`SELECT * FROM categories WHERE id = ?`).bind(id).first<Record<string, unknown>>();
      if (!row) return errorJson("Not found", 404);
      return json(toCategory({ ...row, product_count: 0 }));
    }
    if (categoryMatch && method === "DELETE") {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      await db.prepare(`DELETE FROM categories WHERE id = ?`).bind(Number(categoryMatch[1])).run();
      return new Response(null, { status: 204 });
    }

    return errorJson("Not found", 404);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
};
