import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, customersTable } from "@workspace/db";
import { ListOrdersQueryParams, CreateOrderBody, GetOrderParams, UpdateOrderStatusParams, UpdateOrderStatusBody } from "@workspace/api-zod";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

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

router.get("/orders", async (req, res) => {
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

  // Fetch product prices
  let total = 0;
  const enrichedItems: Array<{ productId: number; quantity: number; unitPriceBdt: string }> = [];
  for (const item of items) {
    const [product] = await db.select({ priceBdt: productsTable.priceBdt }).from(productsTable).where(eq(productsTable.id, item.product_id));
    if (!product) { res.status(400).json({ error: `Product ${item.product_id} not found` }); return; }
    const price = Number(product.priceBdt);
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

  const result = await getOrderWithItems(order.id);
  res.status(201).json(result);
});

router.get("/orders/:id", async (req, res) => {
  const parsed = GetOrderParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }
  const order = await getOrderWithItems(parsed.data.id);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(order);
});

router.patch("/orders/:id/status", async (req, res) => {
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
