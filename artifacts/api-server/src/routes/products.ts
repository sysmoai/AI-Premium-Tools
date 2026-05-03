import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db";
import { ListProductsQueryParams, CreateProductBody, GetProductParams, UpdateProductParams, UpdateProductBody, DeleteProductParams } from "@workspace/api-zod";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

const router = Router();

router.get("/products", async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { category_id, search, featured, is_active } = parsed.data;

  const conditions = [];
  if (category_id !== undefined) conditions.push(eq(productsTable.categoryId, category_id));
  if (featured !== undefined) conditions.push(eq(productsTable.isFeatured, featured));
  if (is_active !== undefined) conditions.push(eq(productsTable.isActive, is_active));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      price_bdt: productsTable.priceBdt,
      original_price_bdt: productsTable.originalPriceBdt,
      category_id: productsTable.categoryId,
      category_name: categoriesTable.name,
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
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length ? and(...conditions) : undefined);

  res.json(rows.map(r => ({
    ...r,
    price_bdt: Number(r.price_bdt),
    original_price_bdt: r.original_price_bdt ? Number(r.original_price_bdt) : undefined,
    created_at: r.created_at?.toISOString(),
  })));
});

router.post("/products", requireAdmin, async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const { name, description, price_bdt, original_price_bdt, category_id, image_url, features, duration_days, is_active, is_featured, stock_count } = parsed.data;

  const [product] = await db.insert(productsTable).values({
    name,
    description: description ?? null,
    priceBdt: String(price_bdt),
    originalPriceBdt: original_price_bdt != null ? String(original_price_bdt) : null,
    categoryId: category_id,
    imageUrl: image_url && image_url.trim() !== "" ? image_url.trim() : null,
    features: features ?? null,
    durationDays: duration_days ?? 30,
    isActive: is_active ?? true,
    isFeatured: is_featured ?? false,
    stockCount: stock_count ?? 100,
  }).returning();

  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  res.status(201).json({
    ...product,
    price_bdt: Number(product.priceBdt),
    original_price_bdt: product.originalPriceBdt ? Number(product.originalPriceBdt) : undefined,
    category_name: cat?.name,
    created_at: product.createdAt.toISOString(),
  });
});

router.get("/products/:id", async (req, res) => {
  const parsed = GetProductParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }

  const [row] = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      description: productsTable.description,
      price_bdt: productsTable.priceBdt,
      original_price_bdt: productsTable.originalPriceBdt,
      category_id: productsTable.categoryId,
      category_name: categoriesTable.name,
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
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, parsed.data.id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    ...row,
    price_bdt: Number(row.price_bdt),
    original_price_bdt: row.original_price_bdt ? Number(row.original_price_bdt) : undefined,
    created_at: row.created_at?.toISOString(),
  });
});

router.put("/products/:id", requireAdmin, async (req, res) => {
  const paramsParsed = UpdateProductParams.safeParse({ id: req.params.id });
  const bodyParsed = UpdateProductBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: paramsParsed.error || bodyParsed.error }); return;
  }
  const { name, description, price_bdt, original_price_bdt, category_id, image_url, features, duration_days, is_active, is_featured, stock_count } = bodyParsed.data;

  const [product] = await db.update(productsTable).set({
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(price_bdt !== undefined && { priceBdt: String(price_bdt) }),
    ...(original_price_bdt !== undefined && { originalPriceBdt: String(original_price_bdt) }),
    ...(category_id !== undefined && { categoryId: category_id }),
    ...(image_url !== undefined && { imageUrl: image_url && image_url.trim() !== "" ? image_url.trim() : null }),
    ...(features !== undefined && { features }),
    ...(duration_days !== undefined && { durationDays: duration_days }),
    ...(is_active !== undefined && { isActive: is_active }),
    ...(is_featured !== undefined && { isFeatured: is_featured }),
    ...(stock_count !== undefined && { stockCount: stock_count }),
  }).where(eq(productsTable.id, paramsParsed.data.id)).returning();

  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  const [cat] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  res.json({
    ...product,
    price_bdt: Number(product.priceBdt),
    original_price_bdt: product.originalPriceBdt ? Number(product.originalPriceBdt) : undefined,
    category_name: cat?.name,
    created_at: product.createdAt.toISOString(),
  });
});

router.delete("/products/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteProductParams.safeParse({ id: req.params.id });
  if (!parsed.success) { res.status(400).json({ error: parsed.error }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
