/**
 * seed-categories.ts
 *
 * Bootstraps the 8 AIPT product categories. Required before
 * seed-products, which looks up categories by slug and fails if
 * they don't exist yet.
 *
 * Run:  pnpm --filter @workspace/scripts run seed-categories
 */

import { db, categoriesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const CATEGORIES = [
  { name: "AI Text & Writing", slug: "ai-text", icon: "✍️", description: "Writing, chat and language-model tools." },
  { name: "AI Image & Design", slug: "ai-image", icon: "🎨", description: "Image generation and design tools." },
  { name: "AI Productivity", slug: "ai-productivity", icon: "⚡", description: "Productivity and workspace AI tools." },
  { name: "AI Video & Audio", slug: "ai-video", icon: "🎬", description: "Video and audio generation tools." },
  { name: "Student Packages", slug: "student-packages", icon: "🎓", description: "Bundles built for university life." },
  { name: "Freelancer Packages", slug: "freelancer-packages", icon: "💼", description: "Bundles built for freelance work." },
  { name: "AI Code & Dev", slug: "ai-code", icon: "🤖", description: "Coding assistants and dev tools." },
  { name: "AI Automation", slug: "ai-automation", icon: "🤖", description: "Workflow and automation tools." },
];

async function main() {
  console.log("Seeding AIPT categories...\n");

  for (const c of CATEGORIES) {
    await db
      .insert(categoriesTable)
      .values(c)
      .onConflictDoUpdate({
        target: categoriesTable.slug,
        set: { name: c.name, icon: c.icon, description: c.description },
      });
    console.log(`  ✓ ${c.name}`);
  }

  console.log("\nDone.");
  await db.execute(sql`SELECT 1`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
