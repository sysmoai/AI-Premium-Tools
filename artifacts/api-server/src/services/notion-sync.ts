import { logger } from "../lib/logger";

export {
  upsertCustomer,
  upsertProduct,
  deleteProduct,
  upsertOrder,
  NOTION_DB,
  type CustomerSync,
  type ProductSync,
  type OrderSync,
  type OrderStatus,
  type PaymentMethod,
} from "@workspace/notion-sync";

/**
 * Fire-and-forget wrapper: never throws, never blocks request handlers.
 * Notion outages must not break order creation.
 */
export function syncInBackground(label: string, run: () => Promise<void>): void {
  void run().catch((err: unknown) => {
    logger.warn({ err, label }, "Notion sync failed (non-fatal)");
  });
}
