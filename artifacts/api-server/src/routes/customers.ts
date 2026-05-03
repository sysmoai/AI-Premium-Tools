import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, ordersTable } from "@workspace/db";
import { CreateCustomerBody, GetCustomerParams } from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";
import { upsertCustomer, syncInBackground } from "../services/notion-sync";

const router = Router();

router.get("/customers", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      phone: customersTable.phone,
      email: customersTable.email,
      university: customersTable.university,
      order_count: sql<number>`cast(count(${ordersTable.id}) as int)`,
      total_spent_bdt: sql<number>`cast(coalesce(sum(${ordersTable.totalBdt}), 0) as float)`,
      created_at: customersTable.createdAt,
    })
    .from(customersTable)
    .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
    .groupBy(customersTable.id);

  res.json(rows.map(r => ({ ...r, created_at: r.created_at?.toISOString() })));
});

router.post("/customers", async (req, res) => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }

  // Upsert by phone number
  const existing = await db.select().from(customersTable).where(eq(customersTable.phone, parsed.data.phone)).limit(1);
  if (existing.length > 0) {
    res.status(201).json({ ...existing[0], order_count: 0, total_spent_bdt: 0, created_at: existing[0].createdAt.toISOString() });
    return;
  }

  const [customer] = await db.insert(customersTable).values({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email ?? null,
    university: parsed.data.university ?? null,
  }).returning();

  syncInBackground(`customer:${customer.id}`, () => upsertCustomer({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    university: customer.university,
    totalOrders: 0,
    totalRevenue: 0,
  }));

  res.status(201).json({ ...customer, order_count: 0, total_spent_bdt: 0, created_at: customer.createdAt.toISOString() });
});

router.get("/customers/:id", requireAdmin, async (req, res) => {
  const parsed = GetCustomerParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }

  const [row] = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      phone: customersTable.phone,
      email: customersTable.email,
      university: customersTable.university,
      order_count: sql<number>`cast(count(${ordersTable.id}) as int)`,
      total_spent_bdt: sql<number>`cast(coalesce(sum(${ordersTable.totalBdt}), 0) as float)`,
      created_at: customersTable.createdAt,
    })
    .from(customersTable)
    .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
    .where(eq(customersTable.id, parsed.data.id))
    .groupBy(customersTable.id);

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, created_at: row.created_at?.toISOString() });
});

export default router;
