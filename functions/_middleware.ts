import {
  AIPT_COMMERCIAL_REVISION,
  findCommercialRule,
  isCommerciallyValidProduct,
} from "./lib/commercial-policy";

interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  COMMERCE_ENABLED?: string;
}

type ProductRow = Record<string, unknown> & {
  id: number;
  name: string;
  price_bdt: number;
  is_active: number;
  commercial_state: string;
};

function adminConfigPresent(env: Env): boolean {
  return Boolean(env.ADMIN_PASSWORD?.trim() && env.SESSION_SECRET?.trim());
}

function commerceApproved(env: Env): boolean {
  return env.COMMERCE_ENABLED?.trim().toLowerCase() === "true";
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-aipt-commercial-revision": AIPT_COMMERCIAL_REVISION,
    },
  });
}

function jsonError(error: string, status: number, code?: string): Response {
  return json(code ? { error, code } : { error }, status);
}

function parseFeatures(value: unknown): unknown {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function toPublicProduct(r: ProductRow) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    price_bdt: Number(r.price_bdt),
    original_price_bdt: r.original_price_bdt != null ? Number(r.original_price_bdt) : undefined,
    category_id: r.category_id,
    category_name: r.category_name ?? undefined,
    image_url: r.image_url ?? undefined,
    features: parseFeatures(r.features),
    duration_days: r.duration_days,
    is_active: true,
    is_featured: !!r.is_featured,
    stock_count: r.stock_count,
    order_count: r.order_count,
    slug: r.slug ?? undefined,
    plan_type: r.plan_type ?? undefined,
    delivery_type: r.delivery_type ?? undefined,
    commercial_state: r.commercial_state,
    created_at: r.created_at ? new Date(Number(r.created_at)).toISOString() : undefined,
  };
}

function isPublicProductPath(pathname: string): boolean {
  return pathname === "/api/products" || /^\/api\/products\/\d+$/.test(pathname);
}

async function governedProductList(env: Env, url: URL): Promise<Response> {
  const conditions = ["p.is_active = 1"];
  const params: unknown[] = [];
  const categoryId = url.searchParams.get("category_id");
  const featured = url.searchParams.get("featured");
  const search = url.searchParams.get("search");

  if (categoryId) {
    const n = Number(categoryId);
    if (!Number.isInteger(n) || n < 1) return jsonError("Invalid category_id", 400);
    conditions.push("p.category_id = ?");
    params.push(n);
  }
  if (featured !== null) {
    conditions.push("p.is_featured = ?");
    params.push(featured === "true" ? 1 : 0);
  }
  if (search) {
    conditions.push("p.name LIKE ?");
    params.push(`%${search.slice(0, 120)}%`);
  }

  const rows = await env.DB
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY p.category_id, p.sort_order, p.id`,
    )
    .bind(...params)
    .all<ProductRow>();

  const safe = (rows.results ?? [])
    .filter((row) => isCommerciallyValidProduct(row))
    .map(toPublicProduct);
  return json(safe);
}

async function governedProductDetail(env: Env, pathname: string): Promise<Response> {
  const match = /^\/api\/products\/(\d+)$/.exec(pathname);
  if (!match) return jsonError("Not found", 404);
  const id = Number(match[1]);
  const row = await env.DB
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
    )
    .bind(id)
    .first<ProductRow>();
  if (!row || !isCommerciallyValidProduct(row)) return jsonError("Not found", 404);
  return json(toPublicProduct(row));
}

async function loadOrder(env: Env, id: number) {
  const order = await env.DB
    .prepare(
      `SELECT o.id, o.customer_id, c.name AS customer_name, c.phone AS customer_phone,
              o.status, o.total_bdt, o.payment_method, o.payment_ref, o.notes,
              o.created_at, o.updated_at
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ?`,
    )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!order) return null;
  const items = await env.DB
    .prepare(
      `SELECT oi.id, oi.order_id, oi.product_id, p.name AS product_name,
              oi.quantity, oi.unit_price_bdt
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
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
    items: (items.results ?? []).map((item) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      product_name: item.product_name ?? undefined,
      quantity: item.quantity,
      unit_price_bdt: Number(item.unit_price_bdt),
    })),
    created_at: new Date(Number(order.created_at)).toISOString(),
    updated_at: new Date(Number(order.updated_at)).toISOString(),
    commercial_revision: AIPT_COMMERCIAL_REVISION,
  };
}

async function governedOrderCreate(context: EventContext<Env, string, unknown>): Promise<Response> {
  type OrderBody = {
    customer_id?: number;
    payment_method?: string;
    payment_ref?: string;
    notes?: string;
    items?: Array<{ product_id?: number; quantity?: number }>;
  };

  let body: OrderBody;
  try {
    body = await context.request.json<OrderBody>();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!Number.isInteger(body.customer_id) || Number(body.customer_id) < 1) {
    return jsonError("Invalid customer_id", 400);
  }
  if (!body.items?.length || body.items.length > 20) {
    return jsonError("Order must contain 1–20 items", 400);
  }
  if (!["bkash", "nagad", "bank_transfer"].includes(String(body.payment_method ?? ""))) {
    return jsonError("Unsupported payment method", 400);
  }

  const customer = await context.env.DB
    .prepare("SELECT id FROM customers WHERE id = ?")
    .bind(body.customer_id)
    .first<{ id: number }>();
  if (!customer) return jsonError("Customer not found", 400);

  let total = 0;
  const enriched: Array<{ productId: number; quantity: number; unitPrice: number }> = [];

  for (const item of body.items) {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return jsonError("Invalid order item", 400);
    }

    const product = await context.env.DB
      .prepare("SELECT id, name, price_bdt, is_active, commercial_state FROM products WHERE id = ?")
      .bind(productId)
      .first<ProductRow>();
    const rule = product ? findCommercialRule(String(product.name)) : null;

    if (!product || !rule || !isCommerciallyValidProduct(product)) {
      return jsonError(
        "This plan requires a current price/access review before checkout. Please contact AIPT support.",
        409,
        "PRICE_REVIEW_REQUIRED",
      );
    }
    if (quantity < rule.minQuantity) {
      return jsonError(
        `This provider plan requires a minimum quantity of ${rule.minQuantity}.`,
        409,
        "MINIMUM_SEATS_REQUIRED",
      );
    }

    total += rule.priceBdt * quantity;
    enriched.push({ productId, quantity, unitPrice: rule.priceBdt });
  }

  const inserted = await context.env.DB
    .prepare(
      `INSERT INTO orders (customer_id, status, total_bdt, payment_method, payment_ref, notes)
       VALUES (?, 'pending', ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      body.customer_id,
      total,
      body.payment_method,
      body.payment_ref?.trim() || null,
      body.notes?.trim() || null,
    )
    .first<{ id: number }>();

  if (!inserted?.id) return jsonError("Order could not be created", 500);

  try {
    await context.env.DB.batch(
      enriched.flatMap((item) => [
        context.env.DB
          .prepare("INSERT INTO order_items (order_id, product_id, quantity, unit_price_bdt) VALUES (?, ?, ?, ?)")
          .bind(inserted.id, item.productId, item.quantity, item.unitPrice),
        context.env.DB
          .prepare("UPDATE products SET order_count = order_count + ? WHERE id = ?")
          .bind(item.quantity, item.productId),
      ]),
    );
  } catch (error) {
    await context.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(inserted.id).run().catch(() => undefined);
    throw error;
  }

  const order = await loadOrder(context.env, inserted.id);
  return json(order, 201);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const isApi = url.pathname === "/api" || url.pathname.startsWith("/api/");
  if (!isApi) return context.next();

  const configPresent = adminConfigPresent(context.env);
  const hasAuthorization = context.request.headers.has("authorization");
  const isAdminLogin = url.pathname === "/api/admin/login";

  // Never allow an authorization-bearing request or admin login to reach the
  // legacy handler without both production auth bindings configured.
  if (!configPresent && (hasAuthorization || isAdminLogin)) {
    return jsonError("Admin authentication unavailable", 503);
  }

  // Public catalog reads are served through the approved policy projection,
  // not directly from raw D1 state. Authenticated admin reads still reach the
  // underlying API so operators can inspect HOLD/PROHIBITED rows.
  if (!hasAuthorization && context.request.method === "GET" && isPublicProductPath(url.pathname)) {
    if (url.pathname === "/api/products") return governedProductList(context.env, url);
    return governedProductDetail(context.env, url.pathname);
  }

  const commerceWrite =
    context.request.method === "POST" &&
    (url.pathname === "/api/customers" || url.pathname === "/api/orders");
  if (commerceWrite && !commerceApproved(context.env)) {
    return jsonError("Purchasing temporarily unavailable while offer eligibility is verified", 503, "COMMERCE_HOLD");
  }

  // Orders are created here so the approved policy is re-checked in the same
  // request that writes order_items. D1 price drift cannot silently become a
  // customer order.
  if (!hasAuthorization && context.request.method === "POST" && url.pathname === "/api/orders") {
    return governedOrderCreate(context);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("x-aipt-commercial-revision", AIPT_COMMERCIAL_REVISION);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
