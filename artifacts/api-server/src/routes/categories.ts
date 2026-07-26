import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { CreateCategoryBody, UpdateCategoryParams, UpdateCategoryBody, DeleteCategoryParams } from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

const router = Router();

router.get("/categories", async (_req, res) => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
      icon: categoriesTable.icon,
      product_count: sql<number>`cast(count(${productsTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id);

  res.json(rows);
});

router.post("/categories", requireAdmin, async (req, res) => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }
  const [cat] = await db.insert(categoriesTable).values({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    icon: parsed.data.icon ?? null,
  }).returning();
  res.status(201).json({ ...cat, product_count: 0 });
});

router.put("/categories/:id", requireAdmin, async (req, res) => {
  const paramsParsed = UpdateCategoryParams.safeParse({ id: req.params.id });
  const bodyParsed = UpdateCategoryBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: paramsParsed.error || bodyParsed.error }); return;
  }
  const [cat] = await db.update(categoriesTable).set({
    ...(bodyParsed.data.name && { name: bodyParsed.data.name }),
    ...(bodyParsed.data.slug && { slug: bodyParsed.data.slug }),
    ...(bodyParsed.data.description !== undefined && { description: bodyParsed.data.description }),
    ...(bodyParsed.data.icon !== undefined && { icon: bodyParsed.data.icon }),
  }).where(eq(categoriesTable.id, paramsParsed.data.id)).returning();
  if (!cat) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...cat, product_count: 0 });
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteCategoryParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
