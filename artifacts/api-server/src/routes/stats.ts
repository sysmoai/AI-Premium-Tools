import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable, customersTable, orderItemsTable } from "@workspace/db";
import { GetRecentOrdersQueryParams, GetTopProductsQueryParams } from "@workspace/api-zod";
import { eq, desc, sql, gte } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

const router = Router();

router.get("/stats/dashboard", requireAdmin, async (_req, res) => {
  const [revenueRow] = await db.select({
    total: sql<number>`cast(coalesce(sum(${ordersTable.totalBdt}), 0) as float)`,
    count: sql<number>`cast(count(*) as int)`,
  }).from(ordersTable).where(eq(ordersTable.status, "delivered"));

  const [pendingRow] = await db.select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(ordersTable).where(eq(ordersTable.status, "pending"));

  const [confirmedRow] = await db.select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(ordersTable).where(eq(ordersTable.status, "confirmed"));

  const [cancelledRow] = await db.select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(ordersTable).where(eq(ordersTable.status, "cancelled"));

  const [customerRow] = await db.select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(customersTable);

  const [productRow] = await db.select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(productsTable).where(eq(productsTable.isActive, true));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [monthlyRow] = await db.select({
    total: sql<number>`cast(coalesce(sum(${ordersTable.totalBdt}), 0) as float)`,
  }).from(ordersTable)
    .where(gte(ordersTable.createdAt, startOfMonth));

  res.json({
    total_revenue_bdt: revenueRow?.total ?? 0,
    total_orders: (revenueRow?.count ?? 0) + (pendingRow?.count ?? 0) + (confirmedRow?.count ?? 0) + (cancelledRow?.count ?? 0),
    total_customers: customerRow?.count ?? 0,
    total_products: productRow?.count ?? 0,
    pending_orders: pendingRow?.count ?? 0,
    delivered_orders: revenueRow?.count ?? 0,
    cancelled_orders: cancelledRow?.count ?? 0,
    monthly_revenue_bdt: monthlyRow?.total ?? 0,
  });
});

router.get("/stats/recent-orders", requireAdmin, async (req, res) => {
  const parsed = GetRecentOrdersQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

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
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);

  res.json(orders.map(o => ({
    ...o,
    total_bdt: Number(o.total_bdt),
    items: [],
    created_at: o.created_at?.toISOString(),
    updated_at: o.updated_at?.toISOString(),
  })));
});

router.get("/stats/top-products", requireAdmin, async (req, res) => {
  const parsed = GetTopProductsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;

  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      price_bdt: productsTable.priceBdt,
      original_price_bdt: productsTable.originalPriceBdt,
      category_id: productsTable.categoryId,
      image_url: productsTable.imageUrl,
      features: productsTable.features,
      duration_days: productsTable.durationDays,
      is_active: productsTable.isActive,
      is_featured: productsTable.isFeatured,
      stock_count: productsTable.stockCount,
      order_count: productsTable.orderCount,
      created_at: productsTable.createdAt,
    })
    .from(productsTable)
    .orderBy(desc(productsTable.orderCount))
    .limit(limit);

  res.json(rows.map(r => ({
    ...r,
    price_bdt: Number(r.price_bdt),
    original_price_bdt: r.original_price_bdt ? Number(r.original_price_bdt) : undefined,
    category_name: undefined,
    created_at: r.created_at?.toISOString(),
  })));
});

export default router;
