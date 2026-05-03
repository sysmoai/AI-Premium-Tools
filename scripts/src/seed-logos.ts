/**
 * seed-logos.ts
 *
 * Seeds image_url for known AI tool products.
 * This script ONLY updates image_url — it never modifies name, price,
 * category, or any other field.  Safe to run multiple times (idempotent).
 *
 * Logo source: locally-bundled SVG/PNG assets in
 *   artifacts/aipt-store/public/logos/
 *
 * Brands without a bundled logo (Canva, Adobe Creative Cloud, Runway,
 * Leonardo, Ideogram, HeyGen, x.ai, Udio, Manus, Otter, Gamma,
 * Writesonic, Lindy, plus all multi-product packages) are intentionally
 * left as NULL so the ProductLogoBanner gradient + initial-letter
 * fallback renders cleanly instead of attempting a broken request.
 *
 * Run:  pnpm --filter @workspace/scripts run seed-logos
 */

import { db, productsTable } from "@workspace/db";
import { ilike } from "drizzle-orm";

const LOGO_MAP: Array<{ namePattern: string; imageUrl: string }> = [
  { namePattern: "ChatGPT%", imageUrl: "/logos/openai.svg" },
  { namePattern: "Claude%", imageUrl: "/logos/anthropic.svg" },
  { namePattern: "Gemini%", imageUrl: "/logos/google_gemini.svg" },
  { namePattern: "Google AI%", imageUrl: "/logos/google_gemini.svg" },
  { namePattern: "Perplexity%", imageUrl: "/logos/perplexity.svg" },
  { namePattern: "Midjourney%", imageUrl: "/logos/midjourney.png" },
  { namePattern: "Adobe%", imageUrl: "/logos/adobe.png" },
  { namePattern: "Notion%", imageUrl: "/logos/notion.svg" },
  { namePattern: "Grammarly%", imageUrl: "/logos/grammarly.svg" },
  { namePattern: "ElevenLabs%", imageUrl: "/logos/elevenlabs.svg" },
  { namePattern: "GitHub Copilot%", imageUrl: "/logos/github.svg" },
  { namePattern: "Cursor%", imageUrl: "/logos/cursor.svg" },
  { namePattern: "Suno%", imageUrl: "/logos/suno.svg" },
  { namePattern: "v0.dev%", imageUrl: "/logos/vercel.svg" },
  { namePattern: "Replit%", imageUrl: "/logos/replit.svg" },
  { namePattern: "Make.com%", imageUrl: "/logos/make.svg" },
  { namePattern: "Zapier%", imageUrl: "/logos/zapier.svg" },
  { namePattern: "n8n%", imageUrl: "/logos/n8n.svg" },
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
