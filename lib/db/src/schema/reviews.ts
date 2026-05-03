import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { ordersTable } from "./orders";

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => productsTable.id).notNull(),
    orderId: integer("order_id").references(() => ordersTable.id),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_reviews_product_id").on(t.productId),
    index("idx_reviews_status").on(t.status),
  ],
);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, status: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
