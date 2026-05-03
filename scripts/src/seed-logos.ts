/**
 * seed-logos.ts
 *
 * Seeds image_url for known AI tool products.
 * This script ONLY updates image_url — it never modifies name, price,
 * category, or any other field.  Safe to run multiple times (idempotent).
 *
 * Logo URL strategy:
 *   - Clearbit Logo API  → https://logo.clearbit.com/<domain>
 *   - Wikimedia Commons  → fallback for tools not indexed by Clearbit
 *
 * Run:  pnpm --filter @workspace/scripts run seed-logos
 */

import { db, productsTable } from "@workspace/db";
import { ilike, isNull, or } from "drizzle-orm";

const LOGO_MAP: Array<{ namePattern: string; imageUrl: string }> = [
  {
    namePattern: "ChatGPT%",
    imageUrl: "https://logo.clearbit.com/openai.com",
  },
  {
    namePattern: "Claude%",
    imageUrl: "https://logo.clearbit.com/anthropic.com",
  },
  {
    namePattern: "Midjourney%",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
  },
  {
    namePattern: "Canva%",
    imageUrl: "https://logo.clearbit.com/canva.com",
  },
  {
    namePattern: "Notion%",
    imageUrl: "https://logo.clearbit.com/notion.so",
  },
  {
    namePattern: "Grammarly%",
    imageUrl: "https://logo.clearbit.com/grammarly.com",
  },
  {
    namePattern: "Runway%",
    imageUrl: "https://logo.clearbit.com/runwayml.com",
  },
  {
    namePattern: "ElevenLabs%",
    imageUrl: "https://logo.clearbit.com/elevenlabs.io",
  },
];

async function main() {
  console.log("Seeding product logo URLs...");

  for (const { namePattern, imageUrl } of LOGO_MAP) {
    const updated = await db
      .update(productsTable)
      .set({ imageUrl })
      .where(ilike(productsTable.name, namePattern))
      .returning({ id: productsTable.id, name: productsTable.name });

    for (const row of updated) {
      console.log(`  ✓ [${row.id}] ${row.name} → ${imageUrl}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
