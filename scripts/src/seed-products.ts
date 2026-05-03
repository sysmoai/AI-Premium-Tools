/**
 * seed-products.ts
 *
 * Authoritative product catalog for the AIPT store.
 *
 * 29 products total: 18 core AI tools + 11 student/freelancer bundles.
 * All pricing follows AIPT positioning: student-friendly, ~15-20% below
 * standard market rates, with shared/personal/key tiers where applicable.
 *
 * Run:  pnpm --filter @workspace/scripts run seed-products
 */

import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

async function getCategoryId(slug: string): Promise<number> {
  const [row] = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug));
  if (!row) throw new Error(`Category not found: ${slug}`);
  return row.id;
}

async function main() {
  console.log("Seeding AIPT product catalog (29 products)...\n");

  const aiText = await getCategoryId("ai-text");
  const aiImage = await getCategoryId("ai-image");
  const aiProductivity = await getCategoryId("ai-productivity");
  const aiVideo = await getCategoryId("ai-video");
  const studentPkg = await getCategoryId("student-packages");
  const freelancerPkg = await getCategoryId("freelancer-packages");
  const aiCode = await getCategoryId("ai-code");
  const aiAutomation = await getCategoryId("ai-automation");

  const products = [
    // ── AI Text & Writing (6) ─────────────────────────────────────────────────
    {
      id: 1,
      name: "ChatGPT Plus Shared",
      description:
        "Access ChatGPT Plus (GPT-4o + GPT-5) at a fraction of the cost. Perfect for students who need powerful AI writing, research, and study help.",
      originalPriceBdt: "1990", priceBdt: "499",
      categoryId: aiText, imageUrl: "https://logo.clearbit.com/openai.com",
      features: [
        "GPT-4o + GPT-5 access",
        "DALL-E image generation",
        "Web browsing & file uploads",
        "Advanced data analysis",
        "Shared seat — login alternates",
        "30-day warranty",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },
    {
      id: 2,
      name: "ChatGPT Plus Personal",
      description:
        "Your own private ChatGPT Plus account. Full access to GPT-5, custom GPTs, and unlimited tools. Ideal for daily power users.",
      originalPriceBdt: "2400", priceBdt: "1390",
      categoryId: aiText, imageUrl: "https://logo.clearbit.com/openai.com",
      features: [
        "Dedicated private account",
        "GPT-5 unlimited",
        "Custom GPTs & GPT Store",
        "DALL-E image generation",
        "Code Interpreter",
        "Email + password delivery",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },
    {
      id: 3,
      name: "Claude Pro Shared",
      description:
        "Claude Pro by Anthropic — Bangladesh students' favourite for long essays, thesis drafts, and document analysis with 200K context.",
      originalPriceBdt: "2350", priceBdt: "699",
      categoryId: aiText, imageUrl: "https://logo.clearbit.com/anthropic.com",
      features: [
        "Claude 4 Sonnet & Opus",
        "200K-token context window",
        "Priority access during peak hours",
        "Document & PDF analysis",
        "Projects & Artifacts",
        "Shared seat",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },
    {
      id: 4,
      name: "Claude Pro Personal",
      description:
        "Private Claude Pro account — uninterrupted access for heavy academic, legal, and writing workflows.",
      originalPriceBdt: "2350", priceBdt: "1690",
      categoryId: aiText, imageUrl: "https://logo.clearbit.com/anthropic.com",
      features: [
        "Dedicated personal account",
        "Claude 4 Opus access",
        "200K context",
        "Projects & MCP support",
        "Email + password delivery",
        "30-day warranty",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 5,
      name: "Gemini Advanced (Google AI Pro)",
      description:
        "Google's flagship AI with Gemini 2.5 Pro, Veo video, and 2 TB Drive. Pairs perfectly with Gmail, Docs, and YouTube.",
      originalPriceBdt: "2200", priceBdt: "599",
      categoryId: aiText, imageUrl: "https://logo.clearbit.com/gemini.google.com",
      features: [
        "Gemini 2.5 Pro",
        "Veo video generation",
        "Deep Research mode",
        "2 TB Google Drive included",
        "NotebookLM Plus",
        "Shared seat",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 80,
    },
    {
      id: 6,
      name: "Perplexity Pro",
      description:
        "AI-powered research engine with cited sources. Replaces 10 Google tabs — ideal for assignments and fact-checking.",
      originalPriceBdt: "1990", priceBdt: "390",
      categoryId: aiText, imageUrl: "https://logo.clearbit.com/perplexity.ai",
      features: [
        "GPT-5, Claude 4, Gemini 2.5 inside",
        "Unlimited Pro searches",
        "File uploads & analysis",
        "Image generation included",
        "Cited, source-linked answers",
        "1-year codes available on request",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },

    // ── AI Image & Design (5) ─────────────────────────────────────────────────
    {
      id: 7,
      name: "Midjourney Basic Shared",
      description:
        "World-class AI art generation. Create stunning visuals for projects, presentations, social posts, and freelance gigs.",
      originalPriceBdt: "1490", priceBdt: "999",
      categoryId: aiImage,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
      features: [
        "Midjourney v7 access",
        "~200 fast generations/month",
        "All artistic styles & references",
        "Upscaling & variations",
        "Shared Discord seat",
        "Commercial-use rights",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 60,
    },
    {
      id: 8,
      name: "Canva Pro",
      description:
        "Premium templates, brand kit, background remover, AI image and video generation — the must-have design app for students.",
      originalPriceBdt: "490", priceBdt: "199",
      categoryId: aiImage, imageUrl: "https://logo.clearbit.com/canva.com",
      features: [
        "100M+ premium templates",
        "Magic Studio AI tools",
        "Background remover",
        "Brand Kit & Magic Resize",
        "100 GB cloud storage",
        "1-year option ৳999",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 200,
    },
    {
      id: 9,
      name: "Adobe Creative Cloud All Apps",
      description:
        "Photoshop, Illustrator, Premiere, After Effects, Lightroom and more — the full Adobe suite for design and video students.",
      originalPriceBdt: "5990", priceBdt: "1490",
      categoryId: aiImage, imageUrl: "https://logo.clearbit.com/adobe.com",
      features: [
        "All 20+ Adobe apps",
        "Photoshop, Illustrator, Premiere",
        "Adobe Firefly AI included",
        "100 GB cloud storage",
        "Personal account with email",
        "30-day warranty",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 10,
      name: "Leonardo AI Apprentice",
      description:
        "Fast, controllable AI image generation tuned for game art, product mockups, and social content.",
      originalPriceBdt: "1190", priceBdt: "490",
      categoryId: aiImage, imageUrl: "https://logo.clearbit.com/leonardo.ai",
      features: [
        "8,500 fast tokens/month",
        "Image-to-image & inpainting",
        "Custom model training",
        "ControlNet access",
        "Personal account",
        "Commercial-use rights",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },
    {
      id: 11,
      name: "Ideogram Plus",
      description:
        "Best-in-class AI image generator for posters, logos, and typography — no competitor handles text in images this well.",
      originalPriceBdt: "990", priceBdt: "590",
      categoryId: aiImage, imageUrl: "https://logo.clearbit.com/ideogram.ai",
      features: [
        "400 priority generations/month",
        "Perfect text-in-image rendering",
        "Magic Prompt enhancement",
        "Personal account",
        "Commercial-use rights",
        "30-day warranty",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },

    // ── AI Video & Audio (3) ──────────────────────────────────────────────────
    {
      id: 12,
      name: "Runway Gen-3 Standard",
      description:
        "Pro-grade AI video generation. Turn text or images into cinematic clips — used by filmmakers and content creators worldwide.",
      originalPriceBdt: "1799", priceBdt: "1390",
      categoryId: aiVideo, imageUrl: "https://logo.clearbit.com/runwayml.com",
      features: [
        "Gen-3 Alpha & Gen-4 access",
        "625 credits/month",
        "Text-to-video & image-to-video",
        "Video-to-video & inpainting",
        "4K upscaling",
        "Personal account",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 13,
      name: "ElevenLabs Creator",
      description:
        "Generate ultra-realistic AI voices in 30+ languages including Bangla. Clone your own voice for podcasts, reels, and YouTube.",
      originalPriceBdt: "2200", priceBdt: "990",
      categoryId: aiVideo, imageUrl: "https://logo.clearbit.com/elevenlabs.io",
      features: [
        "100K characters/month",
        "Voice cloning",
        "30+ languages incl. Bangla",
        "Commercial license",
        "Voice library access",
        "Personal account",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 14,
      name: "HeyGen Creator",
      description:
        "Create AI avatar videos that speak any language. Perfect for course creators, marketers, and freelance video editors.",
      originalPriceBdt: "2900", priceBdt: "1490",
      categoryId: aiVideo, imageUrl: "https://logo.clearbit.com/heygen.com",
      features: [
        "30 minutes of video/month",
        "150+ AI avatars",
        "175+ languages",
        "Custom avatar (with proof)",
        "Personal account",
        "30-day warranty",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },

    // ── AI Productivity (2) ───────────────────────────────────────────────────
    {
      id: 15,
      name: "Notion AI Add-on",
      description:
        "Add an AI co-writer to your Notion workspace. Summarize lectures, draft assignments, and Q&A on your own notes.",
      originalPriceBdt: "1100", priceBdt: "390",
      categoryId: aiProductivity, imageUrl: "https://logo.clearbit.com/notion.so",
      features: [
        "AI writing assistant",
        "Summarize & translate",
        "Action item extraction",
        "Q&A on your workspace",
        "Works on any Notion plan",
        "Shared seat",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 80,
    },
    {
      id: 16,
      name: "Grammarly Premium",
      description:
        "Catch grammar errors, improve clarity, and adjust tone. Essential for assignments, emails, and IELTS-level writing.",
      originalPriceBdt: "1500", priceBdt: "299",
      categoryId: aiProductivity, imageUrl: "https://logo.clearbit.com/grammarly.com",
      features: [
        "Advanced grammar & spell check",
        "Tone & clarity suggestions",
        "Plagiarism detection",
        "Generative AI rewrites",
        "Works in Word, Docs, browser",
        "1-year option ৳1,490",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 150,
    },

    // ── AI Code & Dev (2) ─────────────────────────────────────────────────────
    {
      id: 17,
      name: "GitHub Copilot Pro",
      description:
        "AI pair-programmer powered by GPT-4o. Autocomplete, chat, and code review for CSE students and dev freelancers.",
      originalPriceBdt: "1190", priceBdt: "490",
      categoryId: aiCode, imageUrl: "https://logo.clearbit.com/github.com",
      features: [
        "GPT-4o & Claude 4 in editor",
        "VS Code, JetBrains, Neovim",
        "Copilot Chat & Edits",
        "Pull request summaries",
        "Personal account with email",
        "Free for verified students",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 18,
      name: "Cursor Pro",
      description:
        "The AI-first code editor used by serious developers. Build full features with Composer agent and Claude/GPT inside your repo.",
      originalPriceBdt: "2400", priceBdt: "1290",
      categoryId: aiCode, imageUrl: "https://logo.clearbit.com/cursor.com",
      features: [
        "500 fast premium requests/mo",
        "Composer multi-file agent",
        "GPT-5, Claude 4 Opus, Gemini 2.5",
        "Codebase-aware chat",
        "Personal account",
        "Cancel anytime",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },

    // ── Student Packages (6) ──────────────────────────────────────────────────
    {
      id: 19,
      name: "Student Essentials Package",
      description:
        "The starter pack every Bangladeshi student needs — ChatGPT Plus + Grammarly + Canva Pro at one combined price.",
      originalPriceBdt: "1290", priceBdt: "449",
      categoryId: studentPkg, imageUrl: null,
      features: [
        "ChatGPT Plus (Shared)",
        "Grammarly Premium",
        "Canva Pro (30 days)",
        "Save 65% vs buying separately",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },
    {
      id: 20,
      name: "University Pro Package",
      description:
        "Our most popular student bundle — pair ChatGPT and Claude with Notion AI for unbeatable academic productivity.",
      originalPriceBdt: "1990", priceBdt: "899",
      categoryId: studentPkg, imageUrl: null,
      features: [
        "ChatGPT Plus (Shared)",
        "Claude Pro (Shared)",
        "Notion AI Add-on",
        "Best-seller — 4.9/5 rated",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },
    {
      id: 21,
      name: "Research Powerhouse Package",
      description:
        "Built for thesis writers and research scholars — long-context Claude, Perplexity research engine, and Grammarly polish.",
      originalPriceBdt: "2290", priceBdt: "1199",
      categoryId: studentPkg, imageUrl: null,
      features: [
        "Claude Pro (Shared)",
        "Perplexity Pro",
        "Grammarly Premium",
        "ChatGPT Plus (Shared) bonus",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 60,
    },
    {
      id: 22,
      name: "Creative Student Bundle",
      description:
        "For media, fine arts, and design students — Canva Pro, Midjourney for image generation, and Runway for video projects.",
      originalPriceBdt: "2890", priceBdt: "1399",
      categoryId: studentPkg, imageUrl: null,
      features: [
        "Canva Pro",
        "Midjourney Shared",
        "Runway Gen-3 Standard",
        "ChatGPT Plus (Shared) bonus",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 23,
      name: "Thesis Writer Pack",
      description:
        "Finish your thesis 3× faster — Claude Pro Personal for long writing, Grammarly for polish, and Perplexity for citations.",
      originalPriceBdt: "2890", priceBdt: "1690",
      categoryId: studentPkg, imageUrl: null,
      features: [
        "Claude Pro (Personal)",
        "Grammarly Premium",
        "Perplexity Pro",
        "30-day warranty",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 24,
      name: "Internship Boost Pack",
      description:
        "Land your first internship — AI to polish your resume, build a portfolio site, and ace mock interviews.",
      originalPriceBdt: "1490", priceBdt: "699",
      categoryId: studentPkg, imageUrl: null,
      features: [
        "ChatGPT Plus (Shared)",
        "Grammarly Premium",
        "Canva Pro (resume + portfolio)",
        "Free 30-min coaching call",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 60,
    },

    // ── Freelancer Packages (5) ───────────────────────────────────────────────
    {
      id: 25,
      name: "Freelancer Starter Pack",
      description:
        "Launch your freelancing career on Fiverr or Upwork with a clean, AI-powered writing and design stack.",
      originalPriceBdt: "1690", priceBdt: "1099",
      categoryId: freelancerPkg, imageUrl: null,
      features: [
        "ChatGPT Plus (Shared)",
        "Canva Pro",
        "Grammarly Premium",
        "Fiverr/Upwork onboarding tips",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },
    {
      id: 26,
      name: "Freelancer Pro Pack",
      description:
        "The complete pro toolkit — personal ChatGPT, Midjourney for visuals, Canva, and ElevenLabs for voiceovers.",
      originalPriceBdt: "3990", priceBdt: "2499",
      categoryId: freelancerPkg, imageUrl: null,
      features: [
        "ChatGPT Plus (Personal)",
        "Midjourney Shared",
        "Canva Pro",
        "ElevenLabs Creator",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 30,
    },
    {
      id: 27,
      name: "Designer Power Pack",
      description:
        "Pixel-perfect design stack — Adobe Creative Cloud, Midjourney, and Ideogram for posters, branding, and product art.",
      originalPriceBdt: "5490", priceBdt: "2790",
      categoryId: freelancerPkg, imageUrl: null,
      features: [
        "Adobe Creative Cloud (All Apps)",
        "Midjourney Shared",
        "Ideogram Plus",
        "Canva Pro bonus",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 20,
    },
    {
      id: 28,
      name: "Video Creator Pack",
      description:
        "Everything to ship YouTube/Reels content — Runway for clips, ElevenLabs for voice, HeyGen for avatars, ChatGPT for scripts.",
      originalPriceBdt: "5990", priceBdt: "3290",
      categoryId: freelancerPkg, imageUrl: null,
      features: [
        "Runway Gen-3 Standard",
        "ElevenLabs Creator",
        "HeyGen Creator",
        "ChatGPT Plus (Shared) bonus",
      ],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 20,
    },
    {
      id: 29,
      name: "AI Premium Monthly Access Pass",
      description:
        "All-access pass to AIPT's most-loved tools at one flat monthly price. The best value for AI power users.",
      originalPriceBdt: "2290", priceBdt: "999",
      categoryId: freelancerPkg, imageUrl: null,
      features: [
        "ChatGPT Plus (Shared)",
        "Claude Pro (Shared)",
        "Canva Pro",
        "Grammarly Premium",
      ],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 80,
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

  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT COALESCE(MAX(id), 0) FROM products))`,
  );
  console.log("\nSequence advanced to max(id).");
  console.log(`\n✅ ${products.length} products seeded.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
