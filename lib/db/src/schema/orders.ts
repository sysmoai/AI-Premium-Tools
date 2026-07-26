import { pgTable, text, serial, timestamp, integer, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { productsTable } from "./products";

export const ordersTable = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customersTable.id).notNull(),
    status: text("status", { enum: ["pending", "confirmed", "delivered", "cancelled"] }).notNull().default("pending"),
    totalBdt: numeric("total_bdt", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: text("payment_method", { enum: ["bkash", "nagad", "bank_transfer"] }).notNull(),
    paymentRef: text("payment_ref"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_orders_customer_id").on(t.customerId),
    index("idx_orders_status").on(t.status),
    index("idx_orders_created_at").on(t.createdAt),
  ],
);

export const orderItemsTable = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").references(() => ordersTable.id).notNull(),
    productId: integer("product_id").references(() => productsTable.id).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceBdt: numeric("unit_price_bdt", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [
    index("idx_order_items_order_id").on(t.orderId),
    index("idx_order_items_product_id").on(t.productId),
  ],
);

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
