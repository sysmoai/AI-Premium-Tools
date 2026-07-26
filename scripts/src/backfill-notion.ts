import { db, productsTable, customersTable, ordersTable, orderItemsTable, categoriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  upsertCustomer,
  upsertProduct,
  upsertOrder,
  type CustomerSync,
  type ProductSync,
  type OrderSync,
} from "@workspace/notion-sync";

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// Notion API limit: ~3 requests/sec. Each upsert internally makes 2 calls (query + create/update).
// Batch=2 with 1500ms pause caps us at ~4 calls / ~3.5s = ~1.1 req/sec, safely under the limit.
const BATCH_SIZE = 2;
const BATCH_PAUSE_MS = 1500;
let counter = 0;
function tick(label: string): void {
  counter++;
  process.stdout.write(`  [${counter}] ${label}\n`);
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (i === attempts - 1) {
        console.error(`  [FAIL] ${label}: ${msg}`);
        return null;
      }
      console.warn(`  [retry ${i + 1}] ${label}: ${msg.slice(0, 120)}`);
      await sleep(800 * (i + 1));
    }
  }
  return null;
}

async function runInBatches<R>(
  rows: R[],
  label: (r: R) => string,
  fn: (r: R) => Promise<unknown>,
): Promise<number> {
  let ok = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const start = Date.now();
    const results = await Promise.all(batch.map(r => withRetry(label(r), () => fn(r).then(() => true))));
    for (let j = 0; j < batch.length; j++) {
      if (results[j] !== null) ok++;
      tick(`${label(batch[j])} (batch ${Math.floor(i / BATCH_SIZE) + 1}, ${Date.now() - start}ms)`);
    }
    if (i + BATCH_SIZE < rows.length) await sleep(BATCH_PAUSE_MS);
  }
  return ok;
}

async function backfillProducts(): Promise<void> {
  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      priceBdt: productsTable.priceBdt,
      originalPriceBdt: productsTable.originalPriceBdt,
      imageUrl: productsTable.imageUrl,
      isActive: productsTable.isActive,
      isFeatured: productsTable.isFeatured,
      orderCount: productsTable.orderCount,
      categoryName: categoriesTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));
  console.log(`\nProducts: ${rows.length}`);
  const ok = await runInBatches(
    rows,
    r => `product:${r.id} ${r.name.slice(0, 40)}`,
    r => upsertProduct({
      id: r.id,
      name: r.name,
      description: r.description,
      priceBdt: Number(r.priceBdt),
      originalPriceBdt: r.originalPriceBdt ? Number(r.originalPriceBdt) : null,
      categoryName: r.categoryName,
      imageUrl: r.imageUrl,
      isActive: r.isActive,
      isFeatured: r.isFeatured,
      orderCount: r.orderCount,
    }),
  );
  console.log(`Products done: ${ok}/${rows.length}`);
}

async function backfillCustomers(): Promise<void> {
  const rows = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      phone: customersTable.phone,
      email: customersTable.email,
      university: customersTable.university,
      total_orders: sql<number>`cast(count(${ordersTable.id}) as int)`,
      total_revenue: sql<number>`cast(coalesce(sum(${ordersTable.totalBdt}), 0) as float)`,
      first_order_at: sql<Date | null>`min(${ordersTable.createdAt})`,
      last_order_at: sql<Date | null>`max(${ordersTable.createdAt})`,
    })
    .from(customersTable)
    .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
    .groupBy(customersTable.id);
  console.log(`\nCustomers: ${rows.length}`);
  const ok = await runInBatches(
    rows,
    r => `customer:${r.id} ${r.name.slice(0, 40)}`,
    r => upsertCustomer({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      university: r.university,
      totalOrders: r.total_orders,
      totalRevenue: r.total_revenue,
      firstOrderAt: r.first_order_at ? new Date(r.first_order_at) : null,
      lastOrderAt: r.last_order_at ? new Date(r.last_order_at) : null,
    }),
  );
  console.log(`Customers done: ${ok}/${rows.length}`);
}

async function backfillOrders(): Promise<void> {
  const rows = await db
    .select({
      id: ordersTable.id,
      status: ordersTable.status,
      totalBdt: ordersTable.totalBdt,
      paymentMethod: ordersTable.paymentMethod,
      paymentRef: ordersTable.paymentRef,
      notes: ordersTable.notes,
      createdAt: ordersTable.createdAt,
      customerName: customersTable.name,
      customerPhone: customersTable.phone,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(customersTable.id, ordersTable.customerId));
  console.log(`\nOrders: ${rows.length}`);
  const enriched = await Promise.all(rows.map(async o => {
    const items = await db
      .select({
        product_name: productsTable.name,
        product_id: orderItemsTable.productId,
        quantity: orderItemsTable.quantity,
      })
      .from(orderItemsTable)
      .leftJoin(productsTable, eq(productsTable.id, orderItemsTable.productId))
      .where(eq(orderItemsTable.orderId, o.id));
    const productSummary = items.map(i => `${i.quantity}x ${i.product_name ?? `#${i.product_id}`}`).join(", ");
    return { ...o, productSummary };
  }));
  const ok = await runInBatches(
    enriched,
    o => `order:${o.id} ${(o.customerName ?? "?").slice(0, 30)}`,
    o => upsertOrder({
      id: o.id,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      productSummary: o.productSummary,
      totalBdt: Number(o.totalBdt),
      status: o.status as OrderSync["status"],
      paymentMethod: o.paymentMethod as OrderSync["paymentMethod"],
      paymentRef: o.paymentRef,
      notes: o.notes,
      createdAt: o.createdAt,
    }),
  );
  console.log(`Orders done: ${ok}/${rows.length}`);
}

async function main(): Promise<void> {
  const arg = process.argv[2] ?? "all";
  console.log(`Backfill mode: ${arg}`);
  if (arg === "products" || arg === "all") await backfillProducts();
  if (arg === "customers" || arg === "all") await backfillCustomers();
  if (arg === "orders" || arg === "all") await backfillOrders();
  console.log("\nBackfill complete.");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
