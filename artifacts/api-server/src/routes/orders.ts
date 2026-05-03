import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, customersTable } from "@workspace/db";
import { ListOrdersQueryParams, CreateOrderBody, GetOrderParams, GetOrderQueryParams, UpdateOrderStatusParams, UpdateOrderStatusBody } from "@workspace/api-zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

const router = Router();

type FullOrder = NonNullable<Awaited<ReturnType<typeof getOrderWithItems>>>;

async function getOrderWithItems(orderId: number) {
  const [order] = await db
    .select({
      id: ordersTable.id,
      customer_id: ordersTable.customerId,
      customer_name: customersTable.name,
      customer_phone: customersTable.phone,
      status: ordersTable.status,
      total_bdt: ordersTable.totalBdt,
      payment_method: ordersTable.paymentMethod,
      payment_ref: ordersTable.paymentRef,
      notes: ordersTable.notes,
      created_at: ordersTable.createdAt,
      updated_at: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(customersTable.id, ordersTable.customerId))
    .where(eq(ordersTable.id, orderId));

  if (!order) return null;

  const items = await db
    .select({
      id: orderItemsTable.id,
      order_id: orderItemsTable.orderId,
      product_id: orderItemsTable.productId,
      product_name: productsTable.name,
      quantity: orderItemsTable.quantity,
      unit_price_bdt: orderItemsTable.unitPriceBdt,
    })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(productsTable.id, orderItemsTable.productId))
    .where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    total_bdt: Number(order.total_bdt),
    items: items.map(i => ({ ...i, unit_price_bdt: Number(i.unit_price_bdt) })),
    created_at: order.created_at?.toISOString(),
    updated_at: order.updated_at?.toISOString(),
  };
}

function digitsOnly(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

function stripPii(order: FullOrder) {
  // Remove PII for non-admin callers — keep only fields safe to show on a
  // customer-facing order tracking page.
  const { customer_phone: _phone, payment_ref: _ref, notes: _notes, ...safe } = order;
  return safe;
}

router.get("/orders", requireAdmin, async (req, res) => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }
  const { status, customer_id } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (customer_id !== undefined) conditions.push(eq(ordersTable.customerId, customer_id));

  const orders = await db
    .select({
      id: ordersTable.id,
      customer_id: ordersTable.customerId,
      customer_name: customersTable.name,
      customer_phone: customersTable.phone,
      status: ordersTable.status,
      total_bdt: ordersTable.totalBdt,
      payment_method: ordersTable.paymentMethod,
      payment_ref: ordersTable.paymentRef,
      notes: ordersTable.notes,
      created_at: ordersTable.createdAt,
      updated_at: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(customersTable.id, ordersTable.customerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  res.json(orders.map(o => ({
    ...o,
    total_bdt: Number(o.total_bdt),
    items: [],
    created_at: o.created_at?.toISOString(),
    updated_at: o.updated_at?.toISOString(),
  })));
});

router.post("/orders", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }
  const { customer_id, payment_method, payment_ref, notes, items } = parsed.data;

  if (items.length === 0) {
    res.status(400).json({ error: "Order must contain at least one item" });
    return;
  }

  // Fetch product prices and verify the product is purchasable
  let total = 0;
  const enrichedItems: Array<{ productId: number; quantity: number; unitPriceBdt: string }> = [];
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      res.status(400).json({ error: `Invalid quantity for product ${item.product_id}` });
      return;
    }
    const [product] = await db
      .select({ priceBdt: productsTable.priceBdt, isActive: productsTable.isActive })
      .from(productsTable)
      .where(eq(productsTable.id, item.product_id));
    if (!product || !product.isActive) {
      res.status(400).json({ error: `Product ${item.product_id} not available` });
      return;
    }
    const price = Number(product.priceBdt);
    if (!Number.isFinite(price) || price < 0) {
      res.status(500).json({ error: `Bad price configuration for product ${item.product_id}` });
      return;
    }
    total += price * item.quantity;
    enrichedItems.push({ productId: item.product_id, quantity: item.quantity, unitPriceBdt: String(price) });
  }

  const [order] = await db.insert(ordersTable).values({
    customerId: customer_id,
    status: "pending",
    totalBdt: String(total),
    paymentMethod: payment_method,
    paymentRef: payment_ref ?? null,
    notes: notes ?? null,
  }).returning();

  await db.insert(orderItemsTable).values(enrichedItems.map(i => ({
    orderId: order.id,
    productId: i.productId,
    quantity: i.quantity,
    unitPriceBdt: i.unitPriceBdt,
  })));

  // Increment order counts
  for (const item of enrichedItems) {
    await db.update(productsTable)
      .set({ orderCount: sql`${productsTable.orderCount} + ${item.quantity}` })
      .where(eq(productsTable.id, item.productId));
  }

  // The customer just placed this order — they're allowed to see all of its
  // PII fields (phone, payment ref, notes) on the order-success screen.
  const result = await getOrderWithItems(order.id);
  res.status(201).json(result);
});

router.get("/orders/:id", async (req, res) => {
  const paramsParsed = GetOrderParams.safeParse({ id: req.params.id });
  if (!paramsParsed.success) { res.status(400).json({ error: paramsParsed.error }); return; }
  const queryParsed = GetOrderQueryParams.safeParse(req.query);
  if (!queryParsed.success) { res.status(400).json({ error: queryParsed.error }); return; }

  const order = await getOrderWithItems(paramsParsed.data.id);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }

  if (req.isAdmin) {
    res.json(order);
    return;
  }

  // Public lookup — require phone match before returning anything.
  const provided = digitsOnly(queryParsed.data.phone);
  const stored = digitsOnly(order.customer_phone);
  if (!provided || !stored || provided !== stored) {
    // Return 404 (not 403) so attackers can't tell whether an order ID exists.
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(stripPii(order));
});

router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  const paramsParsed = UpdateOrderStatusParams.safeParse({ id: req.params.id });
  const bodyParsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: paramsParsed.error || bodyParsed.error }); return;
  }
  const [order] = await db.update(ordersTable).set({ status: bodyParsed.data.status }).where(eq(ordersTable.id, paramsParsed.data.id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const result = await getOrderWithItems(order.id);
  res.json(result);
});

export default router;
