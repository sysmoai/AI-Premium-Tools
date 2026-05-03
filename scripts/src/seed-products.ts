/**
 * seed-products.ts
 *
 * Authoritative product catalog for the AIPT store.
 *
 * This script is the single source of truth for product definitions.
 * It uses INSERT … ON CONFLICT DO UPDATE (upsert) so it is safe to run
 * multiple times without creating duplicates.
 *
 * Pricing policy: AIPT sells premium AI subscriptions at ~20% below
 * the standard retail price.  Each product's price_bdt therefore equals
 * round(original_price_bdt × 0.80).  Any future price change should be
 * applied here first, then re-run this script.
 *
 * Run:  pnpm --filter @workspace/scripts run seed-products
 */

import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Round to nearest 10 BDT — keeps prices looking clean in the UI */
function discounted(original: number, pct = 0.2): number {
  return Math.round((original * (1 - pct)) / 10) * 10;
}

// ── Category lookup ───────────────────────────────────────────────────────────

async function getCategoryId(slug: string): Promise<number> {
  const [row] = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug));
  if (!row) throw new Error(`Category not found: ${slug}`);
  return row.id;
}

// ── Product definitions ───────────────────────────────────────────────────────

async function main() {
  console.log("Seeding product catalog...\n");

  const aiText = await getCategoryId("ai-text");
  const aiImage = await getCategoryId("ai-image");
  const aiProductivity = await getCategoryId("ai-productivity");
  const aiVideo = await getCategoryId("ai-video");
  const studentPkg = await getCategoryId("student-packages");
  const freelancerPkg = await getCategoryId("freelancer-packages");

  const products = [
    // ── AI Text & Writing ─────────────────────────────────────────────────────
    {
      id: 1,
      name: "ChatGPT Plus Shared",
      description:
        "Access ChatGPT Plus (GPT-4) at a fraction of the cost. Perfect for students who need powerful AI writing and research assistance.",
      originalPriceBdt: "599",
      priceBdt: String(discounted(599)),
      categoryId: aiText,
      imageUrl: "https://logo.clearbit.com/openai.com",
      features: [
        "GPT-4 access",
        "Image generation with DALL-E",
        "Web browsing",
        "Advanced data analysis",
        "40 messages per 3 hours",
        "Shared account",
      ],
      durationDays: 30,
      isFeatured: true,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 2,
      name: "ChatGPT Plus Solo",
      description:
        "Dedicated ChatGPT Plus account. Full private access to GPT-4 with no sharing — ideal for heavy daily users.",
      originalPriceBdt: "1599",
      priceBdt: String(discounted(1599)),
      categoryId: aiText,
      imageUrl: "https://logo.clearbit.com/openai.com",
      features: [
        "Dedicated private account",
        "GPT-4 unlimited",
        "Custom GPTs",
        "DALL-E image generation",
        "Code interpreter",
        "No sharing",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 3,
      name: "Claude Pro Shared",
      description:
        "Access Claude Pro — Anthropic's powerful AI assistant known for long context and nuanced writing. Great for essays and research.",
      originalPriceBdt: "799",
      priceBdt: String(discounted(799)),
      categoryId: aiText,
      imageUrl: "https://logo.clearbit.com/anthropic.com",
      features: [
        "Claude 3 Opus & Sonnet access",
        "200K token context window",
        "Priority access during peak hours",
        "Shared account",
        "Document analysis",
        "Code generation",
      ],
      durationDays: 30,
      isFeatured: true,
      isActive: true,
      stockCount: 100,
    },

    // ── AI Image & Design ─────────────────────────────────────────────────────
    {
      id: 4,
      name: "Midjourney Shared",
      description:
        "Generate stunning AI images with Midjourney. Access one of the world's best AI image generation tools at student-friendly prices.",
      originalPriceBdt: "1199",
      priceBdt: String(discounted(1199)),
      categoryId: aiImage,
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
      features: [
        "Midjourney v6 access",
        "~200 image generations/month",
        "All artistic styles",
        "Upscaling & variations",
        "Shared account",
        "Commercial use",
      ],
      durationDays: 30,
      isFeatured: true,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 5,
      name: "Canva Pro",
      description:
        "Unlock Canva Pro with premium templates, brand kit, background remover, and AI design tools. Essential for student presentations and projects.",
      originalPriceBdt: "499",
      priceBdt: String(discounted(499)),
      categoryId: aiImage,
      imageUrl: "https://logo.clearbit.com/canva.com",
      features: [
        "100+ million premium templates",
        "Background remover",
        "Brand Kit",
        "Magic Resize",
        "AI image generator",
        "100GB cloud storage",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },

    // ── AI Productivity ───────────────────────────────────────────────────────
    {
      id: 6,
      name: "Notion AI Add-on",
      description:
        "Add AI superpowers to your Notion workspace. Summarize, write, and brainstorm without leaving your notes.",
      originalPriceBdt: "429",
      priceBdt: String(discounted(429)),
      categoryId: aiProductivity,
      imageUrl: "https://logo.clearbit.com/notion.so",
      features: [
        "AI writing assistant",
        "Summarize long documents",
        "Action item extraction",
        "Translation to 10+ languages",
        "Q&A on your notes",
        "Works on any Notion plan",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 7,
      name: "Grammarly Premium",
      description:
        "Write better in English with Grammarly Premium. Catch grammar errors, improve clarity, and match the perfect tone for academic writing.",
      originalPriceBdt: "369",
      priceBdt: String(discounted(369)),
      categoryId: aiProductivity,
      imageUrl: "https://logo.clearbit.com/grammarly.com",
      features: [
        "Advanced grammar & spell check",
        "Tone detection",
        "Clarity suggestions",
        "Plagiarism detection",
        "Citation suggestions",
        "Works everywhere online",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },

    // ── AI Video & Audio ──────────────────────────────────────────────────────
    {
      id: 8,
      name: "Runway Gen-3",
      description:
        "Create and edit professional AI videos. Runway is the go-to AI video tool for creators and filmmakers.",
      originalPriceBdt: "1799",
      priceBdt: String(discounted(1799)),
      categoryId: aiVideo,
      imageUrl: "https://logo.clearbit.com/runwayml.com",
      features: [
        "Gen-3 video generation",
        "125 credits/month",
        "Text-to-video",
        "Image-to-video",
        "Video inpainting",
        "Slow motion & upscaling",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 9,
      name: "ElevenLabs Creator",
      description:
        "Clone voices and generate ultra-realistic AI speech. Perfect for content creators, podcasters, and YouTubers.",
      originalPriceBdt: "999",
      priceBdt: String(discounted(999)),
      categoryId: aiVideo,
      imageUrl: "https://logo.clearbit.com/elevenlabs.io",
      features: [
        "Voice cloning",
        "100K characters/month",
        "29+ languages",
        "Commercial license",
        "Voice library access",
        "API access",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },

    // ── Student Packages ──────────────────────────────────────────────────────
    {
      id: 10,
      name: "Student Essentials Package",
      description:
        "The ultimate student starter pack — ChatGPT Plus + Grammarly + Canva Pro. Everything you need for university.",
      originalPriceBdt: "599",
      priceBdt: "449",
      categoryId: studentPkg,
      imageUrl: null,
      features: [
        "ChatGPT Plus Shared",
        "Grammarly Premium",
        "Canva Pro (30 days)",
      ],
      durationDays: 30,
      isFeatured: true,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 11,
      name: "University Pro Package",
      description:
        "Level up your academic performance with our most popular student bundle — ChatGPT + Claude + Notion AI.",
      originalPriceBdt: "1149",
      priceBdt: "899",
      categoryId: studentPkg,
      imageUrl: null,
      features: [
        "ChatGPT Plus Shared",
        "Claude Pro Shared",
        "Notion AI Add-on",
      ],
      durationDays: 30,
      isFeatured: true,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 12,
      name: "Research Powerhouse Package",
      description:
        "Built for thesis writers and researchers. Get the full AI research toolkit at one affordable price.",
      originalPriceBdt: "1549",
      priceBdt: "1199",
      categoryId: studentPkg,
      imageUrl: null,
      features: [
        "ChatGPT Plus Solo",
        "Claude Pro Shared",
        "Grammarly Premium",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 13,
      name: "Creative Student Bundle",
      description:
        "Design, generate images, and edit videos like a pro. Perfect for media, art, and design students.",
      originalPriceBdt: "1799",
      priceBdt: "1399",
      categoryId: studentPkg,
      imageUrl: null,
      features: [
        "Canva Pro",
        "Midjourney Shared",
        "Runway Gen-3",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },

    // ── Freelancer Packages ───────────────────────────────────────────────────
    {
      id: 14,
      name: "Freelancer Starter Pack",
      description:
        "Launch your freelancing career with essential AI writing and design tools.",
      originalPriceBdt: "1399",
      priceBdt: "1099",
      categoryId: freelancerPkg,
      imageUrl: null,
      features: [
        "ChatGPT Plus Shared",
        "Canva Pro",
        "Grammarly Premium",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 15,
      name: "Freelancer Pro Pack",
      description:
        "The complete AI toolkit for professional freelancers — writing, design, video, and voice.",
      originalPriceBdt: "3199",
      priceBdt: "2499",
      categoryId: freelancerPkg,
      imageUrl: null,
      features: [
        "ChatGPT Plus Solo",
        "Midjourney Shared",
        "Canva Pro",
        "ElevenLabs Creator",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },
    {
      id: 16,
      name: "AI Premium Monthly Access Pass",
      description:
        "Full access to our curated AI tool library. The best value for power users.",
      originalPriceBdt: "1299",
      priceBdt: "999",
      categoryId: freelancerPkg,
      imageUrl: null,
      features: [
        "ChatGPT Plus Shared",
        "Claude Pro Shared",
        "Canva Pro",
        "Grammarly Premium",
      ],
      durationDays: 30,
      isFeatured: false,
      isActive: true,
      stockCount: 100,
    },
  ];

  for (const p of products) {
    await db
      .insert(productsTable)
      .values({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        priceBdt: p.priceBdt,
        originalPriceBdt: p.originalPriceBdt ?? null,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl ?? null,
        features: p.features ?? null,
        durationDays: p.durationDays,
        isFeatured: p.isFeatured,
        isActive: p.isActive,
        stockCount: p.stockCount,
      })
      .onConflictDoUpdate({
        target: productsTable.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          priceBdt: sql`excluded.price_bdt`,
          originalPriceBdt: sql`excluded.original_price_bdt`,
          categoryId: sql`excluded.category_id`,
          imageUrl: sql`excluded.image_url`,
          features: sql`excluded.features`,
          durationDays: sql`excluded.duration_days`,
          isFeatured: sql`excluded.is_featured`,
          isActive: sql`excluded.is_active`,
          stockCount: sql`excluded.stock_count`,
        },
      });

    console.log(`  ✓ [${p.id}] ${p.name}  ৳${p.priceBdt}`);
  }

  // Advance the products sequence to max(id) so that future INSERTs
  // without an explicit id don't collide with the rows we just seeded.
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT COALESCE(MAX(id), 0) FROM products))`,
  );
  console.log("\nSequence advanced to max(id).");

  console.log("Product catalog seeded successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
