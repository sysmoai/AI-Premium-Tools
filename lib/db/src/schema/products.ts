import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceBdt: numeric("price_bdt", { precision: 10, scale: 2 }).notNull(),
  originalPriceBdt: numeric("original_price_bdt", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categoriesTable.id).notNull(),
  imageUrl: text("image_url"),
  features: text("features").array(),
  durationDays: integer("duration_days").default(30),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  stockCount: integer("stock_count").default(100),
  orderCount: integer("order_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, orderCount: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
