/**
 * seed-products.ts
 *
 * Authoritative product catalog for the AIPT store.
 *
 * 60+ products covering every major AI tool tier sold in Bangladesh
 * (Shared / Premium Shared / Personal / Pro / Business) plus AIPT's
 * own student & freelancer bundles. Pricing reflects current
 * Bangladesh market rates.
 *
 * IDs 1-29 are stable because existing orders reference them.
 * New tools start at ID 30.
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

type Seed = {
  id: number;
  name: string;
  description: string;
  originalPriceBdt: string;
  priceBdt: string;
  categoryId: number;
  imageUrl: string | null;
  features: string[];
  durationDays: number;
  isFeatured: boolean;
  isActive: boolean;
  stockCount: number;
};

async function main() {
  console.log("Seeding AIPT product catalog...\n");

  const aiText = await getCategoryId("ai-text");
  const aiImage = await getCategoryId("ai-image");
  const aiProductivity = await getCategoryId("ai-productivity");
  const aiVideo = await getCategoryId("ai-video");
  const studentPkg = await getCategoryId("student-packages");
  const freelancerPkg = await getCategoryId("freelancer-packages");
  const aiCode = await getCategoryId("ai-code");
  const aiAutomation = await getCategoryId("ai-automation");

  // Logo helpers
  const L = {
    openai: "https://logo.clearbit.com/openai.com",
    anthropic: "https://logo.clearbit.com/anthropic.com",
    gemini: "https://logo.clearbit.com/gemini.google.com",
    perplexity: "https://logo.clearbit.com/perplexity.ai",
    grok: "https://logo.clearbit.com/x.ai",
    midjourney:
      "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
    canva: "https://logo.clearbit.com/canva.com",
    adobe: "https://logo.clearbit.com/adobe.com",
    leonardo: "https://logo.clearbit.com/leonardo.ai",
    ideogram: "https://logo.clearbit.com/ideogram.ai",
    runway: "https://logo.clearbit.com/runwayml.com",
    elevenlabs: "https://logo.clearbit.com/elevenlabs.io",
    heygen: "https://logo.clearbit.com/heygen.com",
    suno: "https://logo.clearbit.com/suno.com",
    udio: "https://logo.clearbit.com/udio.com",
    notion: "https://logo.clearbit.com/notion.so",
    grammarly: "https://logo.clearbit.com/grammarly.com",
    github: "https://logo.clearbit.com/github.com",
    cursor: "https://logo.clearbit.com/cursor.com",
    v0: "https://logo.clearbit.com/v0.dev",
    replit: "https://logo.clearbit.com/replit.com",
    manus: "https://logo.clearbit.com/manus.im",
    otter: "https://logo.clearbit.com/otter.ai",
    gamma: "https://logo.clearbit.com/gamma.app",
    writesonic: "https://logo.clearbit.com/writesonic.com",
    make: "https://logo.clearbit.com/make.com",
    zapier: "https://logo.clearbit.com/zapier.com",
    n8n: "https://logo.clearbit.com/n8n.io",
    lindy: "https://logo.clearbit.com/lindy.ai",
  };

  const products: Seed[] = [
    // ── AI Text & Writing ─────────────────────────────────────────────────────
    {
      id: 1, name: "ChatGPT Plus Starter Shared",
      description: "Affordable entry into ChatGPT Plus — perfect for students who need GPT-4o for assignments, research, and study help.",
      originalPriceBdt: "1990", priceBdt: "350",
      categoryId: aiText, imageUrl: L.openai,
      features: ["GPT-4o & GPT-5 access", "DALL-E image generation", "Web browsing", "Shared seat (light usage)", "30-day warranty", "Email + password delivery"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 200,
    },
    {
      id: 2, name: "ChatGPT Plus Personal",
      description: "Your own private ChatGPT Plus account — full GPT-5 access with custom GPTs, no sharing, perfect for daily power users.",
      originalPriceBdt: "3990", priceBdt: "2990",
      categoryId: aiText, imageUrl: L.openai,
      features: ["Dedicated private account", "GPT-5 unlimited", "Custom GPTs & GPT Store", "DALL-E & Code Interpreter", "Email + password delivery", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },
    {
      id: 3, name: "Claude Pro Premium Shared",
      description: "Claude Pro by Anthropic — long essays, thesis drafts, and deep document analysis with a 200K context window.",
      originalPriceBdt: "2990", priceBdt: "1495",
      categoryId: aiText, imageUrl: L.anthropic,
      features: ["Claude 4 Sonnet & Opus", "200K-token context", "Priority access at peak hours", "Projects & Artifacts", "Premium shared seat", "30-day warranty"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },
    {
      id: 4, name: "Claude Pro Personal",
      description: "Private Claude Pro — uninterrupted access for heavy academic, legal, and writing workflows.",
      originalPriceBdt: "3990", priceBdt: "2990",
      categoryId: aiText, imageUrl: L.anthropic,
      features: ["Dedicated personal account", "Claude 4 Opus", "200K context", "Projects, MCP & Artifacts", "Email + password delivery", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 5, name: "Google AI Pro (Gemini Advanced)",
      description: "Google's flagship AI — Gemini 2.5 Pro plus Veo video, Deep Research, and 2 TB Drive included.",
      originalPriceBdt: "2200", priceBdt: "500",
      categoryId: aiText, imageUrl: L.gemini,
      features: ["Gemini 2.5 Pro", "Veo video generation", "Deep Research mode", "2 TB Google Drive", "NotebookLM Plus", "Personal account"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 80,
    },
    {
      id: 6, name: "Perplexity Pro Shared",
      description: "AI research engine with cited sources — replace 10 Google tabs for assignments and fact-checking.",
      originalPriceBdt: "1990", priceBdt: "350",
      categoryId: aiText, imageUrl: L.perplexity,
      features: ["GPT-5 + Claude 4 + Gemini 2.5 inside", "Unlimited Pro searches", "File uploads & analysis", "Image generation", "Cited, source-linked answers", "Shared seat"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 150,
    },

    // ── AI Image & Design ─────────────────────────────────────────────────────
    {
      id: 7, name: "Midjourney Standard Shared",
      description: "World-class AI art generation — visuals for projects, presentations, social posts, and freelance gigs.",
      originalPriceBdt: "2400", priceBdt: "1199",
      categoryId: aiImage, imageUrl: L.midjourney,
      features: ["Midjourney v7 access", "~200 fast generations/mo", "All artistic styles & references", "Upscaling & variations", "Shared Discord seat", "Commercial-use rights"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 60,
    },
    {
      id: 8, name: "Canva Pro",
      description: "Premium templates, brand kit, background remover, AI image and video generation — the must-have design app for students.",
      originalPriceBdt: "499", priceBdt: "199",
      categoryId: aiImage, imageUrl: L.canva,
      features: ["100M+ premium templates", "Magic Studio AI tools", "Background remover", "Brand Kit & Magic Resize", "100 GB cloud storage", "1-year option ৳999"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 200,
    },
    {
      id: 9, name: "Adobe Creative Cloud (All Apps)",
      description: "Photoshop, Illustrator, Premiere, After Effects, Lightroom and 15+ more — the full Adobe suite for design and video students.",
      originalPriceBdt: "5990", priceBdt: "1490",
      categoryId: aiImage, imageUrl: L.adobe,
      features: ["All 20+ Adobe apps", "Photoshop, Illustrator, Premiere", "Adobe Firefly AI included", "100 GB cloud storage", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 10, name: "Leonardo AI Shared",
      description: "Fast, controllable AI image generation tuned for game art, product mockups, and social content.",
      originalPriceBdt: "1190", priceBdt: "599",
      categoryId: aiImage, imageUrl: L.leonardo,
      features: ["8,500 fast tokens/mo", "Image-to-image & inpainting", "Custom model training", "ControlNet access", "Shared seat", "Commercial-use rights"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },
    {
      id: 11, name: "Ideogram Plus",
      description: "Best-in-class AI image generator for posters, logos, and typography — no competitor handles text in images this well.",
      originalPriceBdt: "3990", priceBdt: "2990",
      categoryId: aiImage, imageUrl: L.ideogram,
      features: ["400 priority generations/mo", "Perfect text-in-image rendering", "Magic Prompt enhancement", "Personal account", "Commercial-use rights", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },

    // ── AI Video & Audio ──────────────────────────────────────────────────────
    {
      id: 12, name: "Runway Standard Personal",
      description: "Pro-grade AI video generation — turn text or images into cinematic clips. Used by filmmakers and content creators worldwide.",
      originalPriceBdt: "2990", priceBdt: "1794",
      categoryId: aiVideo, imageUrl: L.runway,
      features: ["Gen-3 Alpha & Gen-4 access", "625 credits/mo", "Text-to-video & image-to-video", "Video-to-video & inpainting", "4K upscaling", "Personal account"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 13, name: "ElevenLabs Creator",
      description: "Generate ultra-realistic AI voices in 30+ languages including Bangla. Clone your own voice for podcasts, reels, and YouTube.",
      originalPriceBdt: "4990", priceBdt: "3289",
      categoryId: aiVideo, imageUrl: L.elevenlabs,
      features: ["100K characters/mo", "Voice cloning", "30+ languages incl. Bangla", "Commercial license", "Voice library access", "Personal account"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 14, name: "HeyGen Creator Shared",
      description: "Create AI avatar videos that speak any language — perfect for course creators, marketers, and freelance video editors.",
      originalPriceBdt: "2900", priceBdt: "1499",
      categoryId: aiVideo, imageUrl: L.heygen,
      features: ["30 minutes of video/mo", "150+ AI avatars", "175+ languages", "Custom avatar (with proof)", "Shared seat", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },

    // ── AI Productivity ───────────────────────────────────────────────────────
    {
      id: 15, name: "Notion AI Add-on",
      description: "Add an AI co-writer to your Notion workspace. Summarize lectures, draft assignments, and Q&A on your own notes.",
      originalPriceBdt: "1100", priceBdt: "390",
      categoryId: aiProductivity, imageUrl: L.notion,
      features: ["AI writing assistant", "Summarize & translate", "Action item extraction", "Q&A on your workspace", "Works on any Notion plan", "Shared seat"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 80,
    },
    {
      id: 16, name: "Grammarly Premium",
      description: "Catch grammar errors, improve clarity, and adjust tone. Essential for assignments, emails, and IELTS-level writing.",
      originalPriceBdt: "1500", priceBdt: "299",
      categoryId: aiProductivity, imageUrl: L.grammarly,
      features: ["Advanced grammar & spell check", "Tone & clarity suggestions", "Plagiarism detection", "Generative AI rewrites", "Works in Word, Docs, browser", "1-year option ৳1,490"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 150,
    },

    // ── AI Code & Dev ─────────────────────────────────────────────────────────
    {
      id: 17, name: "GitHub Copilot Pro Personal",
      description: "AI pair-programmer powered by GPT-4o and Claude 4 — autocomplete, chat, and code review for CSE students and dev freelancers.",
      originalPriceBdt: "2490", priceBdt: "1495",
      categoryId: aiCode, imageUrl: L.github,
      features: ["GPT-4o & Claude 4 in editor", "VS Code, JetBrains, Neovim", "Copilot Chat & Edits", "Pull request summaries", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 18, name: "Cursor Pro Personal",
      description: "The AI-first code editor used by serious developers — Composer agent and Claude/GPT inside your repo.",
      originalPriceBdt: "3990", priceBdt: "2990",
      categoryId: aiCode, imageUrl: L.cursor,
      features: ["500 fast premium requests/mo", "Composer multi-file agent", "GPT-5, Claude 4 Opus, Gemini 2.5", "Codebase-aware chat", "Personal account", "Cancel anytime"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },

    // ── Student Packages ──────────────────────────────────────────────────────
    {
      id: 19, name: "Student Essentials Package",
      description: "The starter pack every Bangladeshi student needs — ChatGPT Plus + Grammarly + Canva Pro at one combined price.",
      originalPriceBdt: "1290", priceBdt: "449",
      categoryId: studentPkg, imageUrl: null,
      features: ["ChatGPT Plus (Shared)", "Grammarly Premium", "Canva Pro (30 days)", "Save 65% vs buying separately"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },
    {
      id: 20, name: "University Pro Package",
      description: "Our most popular student bundle — pair ChatGPT and Claude with Notion AI for unbeatable academic productivity.",
      originalPriceBdt: "1990", priceBdt: "899",
      categoryId: studentPkg, imageUrl: null,
      features: ["ChatGPT Plus (Shared)", "Claude Pro (Shared)", "Notion AI Add-on", "Best-seller — 4.9/5 rated"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 100,
    },
    {
      id: 21, name: "Research Powerhouse Package",
      description: "Built for thesis writers and research scholars — long-context Claude, Perplexity research engine, and Grammarly polish.",
      originalPriceBdt: "2290", priceBdt: "1199",
      categoryId: studentPkg, imageUrl: null,
      features: ["Claude Pro (Shared)", "Perplexity Pro", "Grammarly Premium", "ChatGPT Plus (Shared) bonus"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 60,
    },
    {
      id: 22, name: "Creative Student Bundle",
      description: "For media, fine arts, and design students — Canva Pro, Midjourney for image generation, and Runway for video projects.",
      originalPriceBdt: "2890", priceBdt: "1399",
      categoryId: studentPkg, imageUrl: null,
      features: ["Canva Pro", "Midjourney Shared", "Runway Standard", "ChatGPT Plus (Shared) bonus"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 23, name: "Thesis Writer Pack",
      description: "Finish your thesis 3× faster — Claude Pro Personal for long writing, Grammarly for polish, and Perplexity for citations.",
      originalPriceBdt: "2890", priceBdt: "1690",
      categoryId: studentPkg, imageUrl: null,
      features: ["Claude Pro (Personal)", "Grammarly Premium", "Perplexity Pro", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 24, name: "Internship Boost Pack",
      description: "Land your first internship — AI to polish your resume, build a portfolio site, and ace mock interviews.",
      originalPriceBdt: "1490", priceBdt: "699",
      categoryId: studentPkg, imageUrl: null,
      features: ["ChatGPT Plus (Shared)", "Grammarly Premium", "Canva Pro (resume + portfolio)", "Free 30-min coaching call"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 60,
    },

    // ── Freelancer Packages ───────────────────────────────────────────────────
    {
      id: 25, name: "Freelancer Starter Pack",
      description: "Launch your freelancing career on Fiverr or Upwork with a clean, AI-powered writing and design stack.",
      originalPriceBdt: "1690", priceBdt: "1099",
      categoryId: freelancerPkg, imageUrl: null,
      features: ["ChatGPT Plus (Shared)", "Canva Pro", "Grammarly Premium", "Fiverr/Upwork onboarding tips"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },
    {
      id: 26, name: "Freelancer Pro Pack",
      description: "The complete pro toolkit — personal ChatGPT, Midjourney for visuals, Canva, and ElevenLabs for voiceovers.",
      originalPriceBdt: "5990", priceBdt: "3999",
      categoryId: freelancerPkg, imageUrl: null,
      features: ["ChatGPT Plus (Personal)", "Midjourney Shared", "Canva Pro", "ElevenLabs Creator"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 30,
    },
    {
      id: 27, name: "Designer Power Pack",
      description: "Pixel-perfect design stack — Adobe Creative Cloud, Midjourney, and Ideogram for posters, branding, and product art.",
      originalPriceBdt: "8490", priceBdt: "4990",
      categoryId: freelancerPkg, imageUrl: null,
      features: ["Adobe Creative Cloud (All Apps)", "Midjourney Shared", "Ideogram Plus", "Canva Pro bonus"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 20,
    },
    {
      id: 28, name: "Video Creator Pack",
      description: "Everything to ship YouTube/Reels content — Runway for clips, ElevenLabs for voice, HeyGen for avatars, ChatGPT for scripts.",
      originalPriceBdt: "8990", priceBdt: "5290",
      categoryId: freelancerPkg, imageUrl: null,
      features: ["Runway Standard", "ElevenLabs Creator", "HeyGen Creator", "ChatGPT Plus (Shared) bonus"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 20,
    },
    {
      id: 29, name: "AI Premium Monthly Access Pass",
      description: "All-access pass to AIPT's most-loved tools at one flat monthly price — the best value for AI power users.",
      originalPriceBdt: "2290", priceBdt: "999",
      categoryId: freelancerPkg, imageUrl: null,
      features: ["ChatGPT Plus (Shared)", "Claude Pro (Shared)", "Canva Pro", "Grammarly Premium"],
      durationDays: 30, isFeatured: true, isActive: true, stockCount: 80,
    },

    // ── New tools (IDs 30+) ───────────────────────────────────────────────────
    // ChatGPT extended tiers
    {
      id: 30, name: "ChatGPT Plus Premium Shared",
      description: "Premium shared ChatGPT Plus — fewer users per seat for smoother daily use and faster GPT-5 responses.",
      originalPriceBdt: "1990", priceBdt: "950",
      categoryId: aiText, imageUrl: L.openai,
      features: ["GPT-5 access", "Premium-tier shared seat", "DALL-E + Code Interpreter", "Web browsing", "Advanced data analysis", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 80,
    },
    {
      id: 31, name: "ChatGPT Go Personal",
      description: "OpenAI's lighter ChatGPT Go plan — full personal access at a lower entry price than Plus.",
      originalPriceBdt: "1690", priceBdt: "1196",
      categoryId: aiText, imageUrl: L.openai,
      features: ["Personal ChatGPT Go account", "GPT-5 access", "Lower message cap than Plus", "Web browsing", "DALL-E", "Email + password delivery"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 50,
    },
    {
      id: 32, name: "ChatGPT Business Starter Shared",
      description: "Business-tier ChatGPT — extended limits, GPT-5 priority, and team-grade reliability on a shared seat.",
      originalPriceBdt: "1990", priceBdt: "699",
      categoryId: aiText, imageUrl: L.openai,
      features: ["ChatGPT Business workspace", "Extended GPT-5 limits", "Connectors & GPT-5 priority", "Shared seat", "Image generation", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 40,
    },
    {
      id: 33, name: "ChatGPT Business Premium Shared",
      description: "Premium ChatGPT Business shared seat — even fewer users per workspace for faster responses.",
      originalPriceBdt: "2490", priceBdt: "1299",
      categoryId: aiText, imageUrl: L.openai,
      features: ["ChatGPT Business workspace", "Premium shared seat", "GPT-5 priority", "Connectors enabled", "Image generation", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 34, name: "ChatGPT Business Personal",
      description: "Private ChatGPT Business workspace — your own seat with GPT-5 priority and connectors.",
      originalPriceBdt: "5990", priceBdt: "3990",
      categoryId: aiText, imageUrl: L.openai,
      features: ["Dedicated ChatGPT Business seat", "GPT-5 priority", "Connectors & data analysis", "DALL-E", "Email + password delivery", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 20,
    },
    {
      id: 35, name: "ChatGPT Pro Premium Shared",
      description: "ChatGPT Pro on a premium shared seat — access GPT-5 Pro and o3-pro reasoning at a fraction of the personal price.",
      originalPriceBdt: "9990", priceBdt: "4500",
      categoryId: aiText, imageUrl: L.openai,
      features: ["GPT-5 Pro & o3-pro reasoning", "Sora video generation", "Operator agent access", "Premium shared seat", "Deep Research mode", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 15,
    },
    {
      id: 36, name: "ChatGPT Pro Personal",
      description: "Top-tier private ChatGPT Pro account — unlimited GPT-5 Pro, Sora, and Operator agent. Built for serious researchers and pros.",
      originalPriceBdt: "44900", priceBdt: "29900",
      categoryId: aiText, imageUrl: L.openai,
      features: ["Dedicated personal account", "GPT-5 Pro & o3-pro", "Sora video generation", "Operator agent", "Deep Research mode", "Email + password delivery"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 5,
    },

    // Claude extended tiers
    {
      id: 37, name: "Claude Max 5x Personal",
      description: "Claude Max with 5× more usage than Pro — for daily heavy users who hit Pro limits often.",
      originalPriceBdt: "19900", priceBdt: "14950",
      categoryId: aiText, imageUrl: L.anthropic,
      features: ["5× Claude Pro usage", "Claude 4 Opus priority", "Projects, Artifacts & MCP", "Personal account", "200K context", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 10,
    },
    {
      id: 38, name: "Claude Max 20x Personal",
      description: "Claude Max with 20× more usage — for power users running long agentic workflows day after day.",
      originalPriceBdt: "39900", priceBdt: "29900",
      categoryId: aiText, imageUrl: L.anthropic,
      features: ["20× Claude Pro usage", "Highest Opus priority", "Projects + MCP servers", "Personal account", "200K context", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 5,
    },
    {
      id: 39, name: "Claude Team Personal Seat",
      description: "Dedicated Claude Team workspace seat — best for small agencies and dev teams sharing prompts and projects.",
      originalPriceBdt: "5990", priceBdt: "3990",
      categoryId: aiText, imageUrl: L.anthropic,
      features: ["Claude Team workspace seat", "Shared Projects across team", "Claude 4 Opus access", "200K context", "Personal seat", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 15,
    },

    // Perplexity / Grok
    {
      id: 40, name: "Perplexity Pro Personal",
      description: "Private Perplexity Pro — unlimited research with no shared-seat queue.",
      originalPriceBdt: "3990", priceBdt: "2990",
      categoryId: aiText, imageUrl: L.perplexity,
      features: ["Dedicated personal account", "Unlimited Pro searches", "GPT-5, Claude 4, Gemini 2.5 inside", "File uploads & analysis", "Image generation", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 41, name: "Perplexity Max Personal",
      description: "The highest Perplexity tier — Labs, deep research agents, and unlimited heavy use.",
      originalPriceBdt: "39900", priceBdt: "29900",
      categoryId: aiText, imageUrl: L.perplexity,
      features: ["Perplexity Labs access", "Deep research agents", "Unlimited Pro + Comet browser", "All frontier models", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 5,
    },
    {
      id: 42, name: "SuperGrok Lite Personal",
      description: "xAI's SuperGrok Lite — Grok 4 with extended limits and DeepSearch on a personal account.",
      originalPriceBdt: "1990", priceBdt: "1495",
      categoryId: aiText, imageUrl: L.grok,
      features: ["Grok 4 model access", "DeepSearch enabled", "Voice mode", "Image generation", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 20,
    },
    {
      id: 43, name: "SuperGrok Standard Personal",
      description: "Full SuperGrok with Grok 4 Heavy reasoning — the strongest xAI tier available to consumers.",
      originalPriceBdt: "5990", priceBdt: "3990",
      categoryId: aiText, imageUrl: L.grok,
      features: ["Grok 4 Heavy reasoning", "DeepSearch + Voice mode", "Higher message limits", "Image generation", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 12,
    },

    // Midjourney extended tiers
    {
      id: 44, name: "Midjourney Standard Premium Shared",
      description: "Midjourney Standard on a premium shared seat — fewer users, smoother peak-hour generation.",
      originalPriceBdt: "3990", priceBdt: "2399",
      categoryId: aiImage, imageUrl: L.midjourney,
      features: ["Midjourney v7 access", "~200 fast generations/mo", "Premium shared Discord seat", "All styles & references", "Upscaling & variations", "Commercial-use rights"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 45, name: "Midjourney Standard Personal",
      description: "Personal Midjourney Standard — your own Discord/web account with no sharing.",
      originalPriceBdt: "5990", priceBdt: "3990",
      categoryId: aiImage, imageUrl: L.midjourney,
      features: ["Dedicated personal account", "Midjourney v7", "~200 fast hours/mo", "Stealth mode optional", "Commercial-use rights", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },
    {
      id: 46, name: "Midjourney Pro Shared",
      description: "Midjourney Pro on a shared seat — 15 fast hours/mo plus unlimited relax queue at a fraction of solo cost.",
      originalPriceBdt: "8990", priceBdt: "4788",
      categoryId: aiImage, imageUrl: L.midjourney,
      features: ["Midjourney Pro tier", "15 fast hours/mo", "Unlimited relax generation", "Stealth mode", "Shared seat", "Commercial-use rights"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 15,
    },
    {
      id: 47, name: "Midjourney Pro Personal",
      description: "Personal Midjourney Pro — 15 fast hours, unlimited relax, and stealth privacy on your own account.",
      originalPriceBdt: "11990", priceBdt: "8970",
      categoryId: aiImage, imageUrl: L.midjourney,
      features: ["Dedicated personal account", "15 fast hours/mo", "Unlimited relax queue", "Stealth privacy", "Commercial-use rights", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 10,
    },
    {
      id: 48, name: "Midjourney Mega Personal",
      description: "Top Midjourney tier — 60 fast hours/mo plus unlimited relax for studios and high-volume creators.",
      originalPriceBdt: "23900", priceBdt: "17940",
      categoryId: aiImage, imageUrl: L.midjourney,
      features: ["60 fast hours/mo", "Unlimited relax queue", "Stealth mode", "Personal account", "Commercial-use rights", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 5,
    },
    {
      id: 49, name: "Ideogram Pro Personal",
      description: "Highest Ideogram tier — 1,000 priority generations/mo for designers and ad creatives.",
      originalPriceBdt: "11990", priceBdt: "8970",
      categoryId: aiImage, imageUrl: L.ideogram,
      features: ["1,000 priority generations/mo", "Best-in-class typography", "Magic Prompt + Canvas", "Personal account", "Commercial-use rights", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 8,
    },

    // Runway extended
    {
      id: 50, name: "Runway Pro Personal",
      description: "Runway Pro — 2,250 credits/mo, 4K exports, and project workspaces. For freelancers and small studios.",
      originalPriceBdt: "5990", priceBdt: "4186",
      categoryId: aiVideo, imageUrl: L.runway,
      features: ["2,250 credits/mo", "4K exports", "Custom voices", "Unlimited projects", "Watermark removal", "Personal account"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 12,
    },
    {
      id: 51, name: "Runway Unlimited Personal",
      description: "Runway Unlimited — explore relaxed generations endlessly, ideal for daily video iteration.",
      originalPriceBdt: "14900", priceBdt: "11362",
      categoryId: aiVideo, imageUrl: L.runway,
      features: ["Unlimited explore generations", "All Pro features", "4K exports", "Project workspaces", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 6,
    },

    // ElevenLabs extended
    {
      id: 52, name: "ElevenLabs Starter Personal",
      description: "Entry-level ElevenLabs with voice cloning and 30K characters/month — perfect for hobbyists and small creators.",
      originalPriceBdt: "1290", priceBdt: "748",
      categoryId: aiVideo, imageUrl: L.elevenlabs,
      features: ["30K characters/mo", "Voice cloning", "30+ languages", "Commercial license", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 53, name: "ElevenLabs Pro Personal",
      description: "ElevenLabs Pro — 500K characters/month, projects mode, and 192 kbps audio. For pro podcasters and audiobook creators.",
      originalPriceBdt: "19900", priceBdt: "14802",
      categoryId: aiVideo, imageUrl: L.elevenlabs,
      features: ["500K characters/mo", "192 kbps PCM audio", "Projects & dubbing", "44.1 kHz quality", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 8,
    },

    // Suno / Udio
    {
      id: 54, name: "Suno AI Pro Personal",
      description: "AI music generation — create full songs with vocals in seconds. Perfect for content creators, ads, and indie artists.",
      originalPriceBdt: "1990", priceBdt: "1495",
      categoryId: aiVideo, imageUrl: L.suno,
      features: ["2,500 credits/mo (~500 songs)", "Personal account", "Commercial-use rights", "Priority generation", "Stems export", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },
    {
      id: 55, name: "Suno AI Premier Personal",
      description: "Top Suno tier — 10,000 credits and early-access models for serious music producers.",
      originalPriceBdt: "5990", priceBdt: "3990",
      categoryId: aiVideo, imageUrl: L.suno,
      features: ["10,000 credits/mo", "Early-access models", "Stems export", "Commercial-use rights", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 10,
    },
    {
      id: 56, name: "Udio Pro Shared",
      description: "Udio AI music generation — high-fidelity vocals and instrumentation on a shared seat.",
      originalPriceBdt: "990", priceBdt: "499",
      categoryId: aiVideo, imageUrl: L.udio,
      features: ["1,200 credits/mo", "High-fidelity audio", "Stems export", "Shared seat", "Commercial-use rights", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },

    // Code & Dev extended
    {
      id: 57, name: "GitHub Copilot Pro+ Personal",
      description: "Copilot Pro+ — premium request pool, Claude 4 Opus & GPT-5 access, and unlimited completions.",
      originalPriceBdt: "7990", priceBdt: "5831",
      categoryId: aiCode, imageUrl: L.github,
      features: ["1,500 premium requests/mo", "Claude 4 Opus + GPT-5", "Unlimited completions", "Pro Agent mode", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 12,
    },
    {
      id: 58, name: "Cursor Pro+ Personal",
      description: "Cursor Pro+ — 3× more premium requests for builders shipping production features daily.",
      originalPriceBdt: "11990", priceBdt: "8970",
      categoryId: aiCode, imageUrl: L.cursor,
      features: ["1,500 fast premium requests/mo", "Composer multi-file agent", "GPT-5 + Claude 4 Opus", "Codebase-aware chat", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 8,
    },
    {
      id: 59, name: "v0.dev Pro Shared",
      description: "Vercel v0 — turn prompts into production React + Tailwind UI in seconds. Pro shared seat at student price.",
      originalPriceBdt: "1990", priceBdt: "999",
      categoryId: aiCode, imageUrl: L.v0,
      features: ["v0 Pro tier", "Premium model access", "Project history", "Component generation", "Shared seat", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },
    {
      id: 60, name: "Replit Core Personal",
      description: "Replit Core — full Replit Agent, faster machines, and 50+ private apps. Perfect for hobbyist app builders.",
      originalPriceBdt: "990", priceBdt: "500",
      categoryId: aiCode, imageUrl: L.replit,
      features: ["Replit Agent access", "50+ private apps", "Faster Boosted Repls", "AI assistant included", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },

    // Productivity extended
    {
      id: 61, name: "Notion Business Monthly",
      description: "Full Notion Business workspace — unlimited blocks, file uploads, and admin controls. Pairs perfectly with Notion AI.",
      originalPriceBdt: "1490", priceBdt: "800",
      categoryId: aiProductivity, imageUrl: L.notion,
      features: ["Notion Business workspace", "Unlimited file uploads", "Private team spaces", "Advanced page analytics", "Personal seat", "6-month plan ৳4,800"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },
    {
      id: 62, name: "Manus AI Personal",
      description: "Manus AI agent — autonomous task execution that browses, codes, and writes for you. The new wave of AI assistants.",
      originalPriceBdt: "3990", priceBdt: "2500",
      categoryId: aiProductivity, imageUrl: L.manus,
      features: ["Autonomous AI agent", "Web browsing & coding", "Long-running tasks", "File output & downloads", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 15,
    },
    {
      id: 63, name: "Otter.ai Pro Shared",
      description: "AI meeting transcription and summaries — never take notes in lectures or client calls again.",
      originalPriceBdt: "1290", priceBdt: "799",
      categoryId: aiProductivity, imageUrl: L.otter,
      features: ["1,200 transcription minutes/mo", "Auto meeting summaries", "Speaker identification", "Zoom/Meet/Teams sync", "Shared seat", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },
    {
      id: 64, name: "Gamma Plus Shared",
      description: "AI presentation generator — turn a prompt into a polished slide deck or web doc in 30 seconds.",
      originalPriceBdt: "799", priceBdt: "399",
      categoryId: aiProductivity, imageUrl: L.gamma,
      features: ["400 AI credits/mo", "Unlimited AI editing", "PPT & PDF export", "Custom fonts & themes", "Shared seat", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 30,
    },
    {
      id: 65, name: "Writesonic Individual Shared",
      description: "AI writing platform with SEO tools, article generator, and brand voice — for marketers and freelance writers.",
      originalPriceBdt: "1490", priceBdt: "799",
      categoryId: aiProductivity, imageUrl: L.writesonic,
      features: ["AI Article Writer 6", "SEO optimizer", "Brand voice profiles", "100+ templates", "Shared seat", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },

    // High-tier bundles aligned to market
    {
      id: 66, name: "Business Power Package",
      description: "Premium business stack — ChatGPT Business Personal, Claude Pro Personal, Notion Business, and Adobe CC. For SMBs and consultants.",
      originalPriceBdt: "19900", priceBdt: "15000",
      categoryId: freelancerPkg, imageUrl: null,
      features: ["ChatGPT Business (Personal)", "Claude Pro (Personal)", "Notion Business", "Adobe Creative Cloud (All Apps)"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 10,
    },
    // ── AI Automation ─────────────────────────────────────────────────────────
    {
      id: 68, name: "Make.com Pro",
      description: "Visual no-code automation — connect 1,500+ apps and run complex multi-step workflows. Loved by ops teams and freelancers.",
      originalPriceBdt: "1990", priceBdt: "1290",
      categoryId: aiAutomation, imageUrl: L.make,
      features: ["10,000 ops/mo", "1,500+ app integrations", "Unlimited active scenarios", "1-min interval scheduling", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },
    {
      id: 69, name: "Zapier Professional",
      description: "The industry-standard automation platform — wire ChatGPT, Sheets, Gmail, Slack and 7,000+ apps with zero code.",
      originalPriceBdt: "2990", priceBdt: "1890",
      categoryId: aiAutomation, imageUrl: L.zapier,
      features: ["2,000 tasks/mo", "Unlimited multi-step Zaps", "Premium app integrations", "Webhooks & paths", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 20,
    },
    {
      id: 70, name: "n8n Cloud Starter",
      description: "Open-source automation in the cloud — full control, AI nodes, and 400+ integrations at a flat monthly price.",
      originalPriceBdt: "1490", priceBdt: "899",
      categoryId: aiAutomation, imageUrl: L.n8n,
      features: ["2,500 workflow executions/mo", "5 active workflows", "Unlimited steps per workflow", "AI agent nodes", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 25,
    },
    {
      id: 71, name: "Lindy AI Personal",
      description: "Build AI employees in minutes — agents that handle email, CRM, scheduling, and outreach autonomously.",
      originalPriceBdt: "3490", priceBdt: "2290",
      categoryId: aiAutomation, imageUrl: L.lindy,
      features: ["400 credits/mo", "Unlimited Lindies (agents)", "Email, CRM, calendar tools", "Multi-step workflows", "Personal account", "30-day warranty"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 15,
    },
    {
      id: 67, name: "B2B Implementation Package",
      description: "Done-for-you AI rollout for your team — premium tools plus a 1-hour onboarding call and SOP setup.",
      originalPriceBdt: "34900", priceBdt: "25000",
      categoryId: freelancerPkg, imageUrl: null,
      features: ["Premium tool stack (5+ tools)", "1-hour onboarding call", "Team SOPs & prompt library", "Priority WhatsApp support"],
      durationDays: 30, isFeatured: false, isActive: true, stockCount: 5,
    },
  ];

  for (const p of products) {
    await db
      .insert(productsTable)
      .values({
        id: p.id,
        name: p.name,
        description: p.description,
        priceBdt: p.priceBdt,
        originalPriceBdt: p.originalPriceBdt,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
        features: p.features,
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
  console.log(`\n✅ ${products.length} products seeded.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
