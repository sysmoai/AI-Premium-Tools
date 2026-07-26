import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { reviewsTable, ordersTable, orderItemsTable, customersTable } from "@workspace/db";
import { ListProductReviewsParams, CreateReviewBody } from "@workspace/api-zod";
import { and, desc, eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

const router = Router();

// Strip HTML tags + control chars to prevent stored-XSS leaking to any future
// renderer that uses dangerouslySetInnerHTML, email templates, or admin tools.
function sanitizePlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Conservative rate limit: a verified buyer leaves at most a handful of
// reviews per order; unverified submissions are dropped if they flood.
const reviewSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many review submissions. Please try again later." },
});

router.get("/products/:id/reviews", async (req, res) => {
  const parsed = ListProductReviewsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const rows = await db
    .select({
      id: reviewsTable.id,
      product_id: reviewsTable.productId,
      customer_name: reviewsTable.customerName,
      rating: reviewsTable.rating,
      title: reviewsTable.title,
      body: reviewsTable.body,
      orderId: reviewsTable.orderId,
      created_at: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.productId, parsed.data.id), eq(reviewsTable.status, "approved")))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(rows.map(r => ({
    id: r.id,
    product_id: r.product_id,
    customer_name: r.customer_name,
    rating: r.rating,
    title: r.title ?? undefined,
    body: r.body,
    verified: r.orderId !== null,
    created_at: r.created_at?.toISOString(),
  })));
});

router.post("/reviews", reviewSubmitLimiter, async (req, res) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { product_id, order_id, customer_phone, customer_name, rating, title, body } = parsed.data;

  // Server-side hard guardrails beyond the schema + HTML sanitization
  const cleanBody = sanitizePlainText(body);
  const cleanName = sanitizePlainText(customer_name);
  const cleanTitle = title ? sanitizePlainText(title) : undefined;
  if (cleanBody.length < 10 || cleanBody.length > 2000) {
    res.status(400).json({ error: "Review body must be 10–2000 characters" });
    return;
  }
  if (cleanName.length < 1 || cleanName.length > 120) {
    res.status(400).json({ error: "Name must be 1–120 characters" });
    return;
  }
  if (cleanTitle && cleanTitle.length > 160) {
    res.status(400).json({ error: "Title must be at most 160 characters" });
    return;
  }

  let verifiedOrderId: number | null = null;
  if (order_id && customer_phone) {
    const [match] = await db
      .select({ orderId: ordersTable.id })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(and(
        eq(ordersTable.id, order_id),
        eq(customersTable.phone, customer_phone),
        eq(orderItemsTable.productId, product_id),
      ))
      .limit(1);
    if (match) {
      const existing = await db
        .select({ id: reviewsTable.id })
        .from(reviewsTable)
        .where(and(eq(reviewsTable.orderId, order_id), eq(reviewsTable.productId, product_id)))
        .limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "You have already reviewed this product for this order." });
        return;
      }
      verifiedOrderId = match.orderId;
    }
  }

  const [created] = await db
    .insert(reviewsTable)
    .values({
      productId: product_id,
      orderId: verifiedOrderId,
      customerName: cleanName,
      customerPhone: customer_phone ?? null,
      rating,
      title: cleanTitle ?? null,
      body: cleanBody,
      status: "pending",
    })
    .returning();

  req.log?.info({ reviewId: created.id, productId: product_id, verified: verifiedOrderId !== null }, "Review submitted");
  res.status(201).json({ id: created.id, status: created.status });
});

router.get("/admin/reviews", requireAdmin, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const conditions = [];
  if (status === "pending" || status === "approved" || status === "rejected") {
    conditions.push(eq(reviewsTable.status, status));
  }
  const rows = await db
    .select()
    .from(reviewsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(reviewsTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id,
    product_id: r.productId,
    order_id: r.orderId,
    customer_name: r.customerName,
    customer_phone: r.customerPhone,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    verified: r.orderId !== null,
    created_at: r.createdAt?.toISOString(),
  })));
});

router.patch("/admin/reviews/:id", requireAdmin, async (req, res) => {
  const idParsed = ListProductReviewsParams.safeParse(req.params);
  if (!idParsed.success) {
    res.status(400).json({ error: idParsed.error });
    return;
  }
  const status = (req.body && typeof req.body === "object" ? req.body.status : undefined) as string | undefined;
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    res.status(400).json({ error: "status must be pending|approved|rejected" });
    return;
  }
  const [updated] = await db
    .update(reviewsTable)
    .set({ status })
    .where(eq(reviewsTable.id, idParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  res.json({ id: updated.id, status: updated.status });
});

router.delete("/admin/reviews/:id", requireAdmin, async (req, res) => {
  const idParsed = ListProductReviewsParams.safeParse(req.params);
  if (!idParsed.success) {
    res.status(400).json({ error: idParsed.error });
    return;
  }
  const result = await db.delete(reviewsTable).where(eq(reviewsTable.id, idParsed.data.id)).returning();
  if (result.length === 0) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  res.status(204).end();
});

export default router;
