/**
 * Regenerates artifacts/aipt-store/public/sitemap.xml and llms.txt
 * from the live products + categories tables.
 *
 * Run after adding/removing products:
 *   pnpm --filter @workspace/scripts run generate-seo-assets
 *
 * Set AIPT_ORIGIN env var to override the canonical origin
 * (default: https://aipt.com.bd).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, productsTable, categoriesTable, pool } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const ORIGIN = process.env.AIPT_ORIGIN ?? "https://aipt.com.bd";
// Resolve repo root from this file's location (scripts/src/ → ../../).
const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, "../../artifacts/aipt-store/public");

function num(v: string | number | null): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const productsRaw = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      priceBdt: productsTable.priceBdt,
      originalPriceBdt: productsTable.originalPriceBdt,
      durationDays: productsTable.durationDays,
      categoryId: productsTable.categoryId,
      description: productsTable.description,
    })
    .from(productsTable)
    .where(eq(productsTable.isActive, true))
    .orderBy(asc(productsTable.categoryId), asc(productsTable.id));

  const products = productsRaw.map(p => ({
    id: p.id,
    name: p.name,
    price: num(p.priceBdt) ?? 0,
    originalPrice: num(p.originalPriceBdt),
    durationDays: p.durationDays,
    categoryId: p.categoryId,
    description: p.description,
  }));

  const cats = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
    })
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.id));

  const today = new Date().toISOString().split("T")[0];
  const urls = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/products", priority: "0.9", changefreq: "daily" },
    { loc: "/faq", priority: "0.7", changefreq: "weekly" },
    { loc: "/about", priority: "0.6", changefreq: "monthly" },
    { loc: "/contact", priority: "0.6", changefreq: "monthly" },
    { loc: "/shipping-policy", priority: "0.5", changefreq: "monthly" },
    { loc: "/refund-policy", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy-policy", priority: "0.4", changefreq: "monthly" },
    { loc: "/terms", priority: "0.4", changefreq: "monthly" },
    { loc: "/track-order", priority: "0.5", changefreq: "monthly" },
    ...cats.map(c => ({
      loc: `/products?category_id=${c.id}`,
      priority: "0.8",
      changefreq: "weekly",
    })),
    ...products.map(p => ({
      loc: `/products/${p.id}`,
      priority: "0.85",
      changefreq: "weekly",
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        u =>
          `  <url>\n    <loc>${ORIGIN}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  writeFileSync(resolve(PUBLIC_DIR, "sitemap.xml"), xml);

  const byCat = new Map<string, typeof products>();
  for (const p of products) {
    const cat = cats.find(c => c.id === p.categoryId);
    const key = cat ? cat.name : "Other";
    const arr = byCat.get(key) ?? [];
    arr.push(p);
    byCat.set(key, arr);
  }

  const lines: string[] = [];
  lines.push(`# AIPT — AI Premium Tools Bangladesh`, ``);
  lines.push(
    `> Bangladesh's leading store for premium AI subscriptions. Pay in BDT (bKash, Nagad, bank), 1-hour activation, 30-day replacement warranty.`,
    ``
  );
  lines.push(`**Country**: Bangladesh`);
  lines.push(`**Currency**: BDT (৳)`);
  lines.push(`**Payment**: bKash, Nagad, Rocket, Upay, Bank transfer`);
  lines.push(`**Delivery**: Within 1 hour (10am–11pm BD time), via WhatsApp`);
  lines.push(`**Warranty**: 30-day replacement on every subscription`);
  lines.push(``, `## How AIPT Works`, ``);
  lines.push(`1. Browse the catalog at /products`);
  lines.push(`2. Add subscriptions to your cart and checkout`);
  lines.push(`3. Pay in BDT via bKash, Nagad, Rocket, Upay, or bank transfer`);
  lines.push(`4. Submit your transaction reference`);
  lines.push(`5. Receive your login credentials on WhatsApp within 1 hour`);
  lines.push(`6. Use your tool — message support for free replacement within 30 days if it fails`);
  lines.push(``, `## Why AIPT vs Direct`, ``);
  lines.push(`- Local BDT payment, no international card`);
  lines.push(`- 15–20% lower than direct vendor pricing in BD after VAT and FX`);
  lines.push(`- Bangla support on WhatsApp during 10am–11pm`);
  lines.push(`- 30-day replacement warranty`);
  lines.push(`- Genuine subscriptions sourced from official channels — never cracked`);
  lines.push(``, `## Product Catalog`, ``);
  for (const [catName, list] of byCat) {
    lines.push(`### ${catName}`, ``);
    for (const p of list) {
      const save =
        p.originalPrice && p.originalPrice > p.price
          ? ` (save ৳${p.originalPrice - p.price})`
          : "";
      const dur = p.durationDays ? ` · ${p.durationDays} days` : "";
      lines.push(`- **${p.name}** — ৳${p.price} BDT${dur}${save}`);
      if (p.description) {
        lines.push(`  - ${p.description.replace(/\s+/g, " ").trim().slice(0, 180)}`);
      }
      lines.push(`  - URL: ${ORIGIN}/products/${p.id}`);
    }
    lines.push(``);
  }
  lines.push(`## Frequently Asked Questions`, ``);
  lines.push(
    `### How do I receive my AI subscription after paying?`,
    `After we confirm your bKash/Nagad/bank payment, login credentials are delivered to your WhatsApp number within 1 hour during 10am–11pm Bangladesh time.`,
    ``,
    `### Are these AI subscriptions genuine?`,
    `Yes. Every account is sourced from official channels. AIPT never sells cracked, hacked, or modified accounts. Backed by a 30-day replacement warranty.`,
    ``,
    `### Can I pay with bKash for ChatGPT Plus in Bangladesh?`,
    `Yes — AIPT is one of the easiest ways to get ChatGPT Plus in Bangladesh using bKash. Place the order, send the bKash payment, receive credentials on WhatsApp within 1 hour.`,
    ``,
    `### What is the cheapest way to use Midjourney, Canva Pro, or Claude in Bangladesh?`,
    `Buying through AIPT is typically 15–20% cheaper than the official rate (which adds BD VAT and FX) and avoids international credit card requirements.`,
    ``,
    `### Do you offer refunds?`,
    `Full refund if we fail to deliver within 24 hours. After delivery, free replacement instead of cash refund.`,
    ``
  );
  lines.push(`## Contact`, ``);
  lines.push(`- WhatsApp: see footer of any page on the site`);
  lines.push(`- Hours: 10am–11pm BD time (UTC+6), 7 days a week`);
  lines.push(`- Order tracking: ${ORIGIN}/track-order`, ``);
  lines.push(`## Site Map`, ``);
  lines.push(`- Home: ${ORIGIN}/`);
  lines.push(`- All products: ${ORIGIN}/products`);
  lines.push(`- FAQ: ${ORIGIN}/faq`);
  lines.push(`- About: ${ORIGIN}/about`);
  lines.push(`- Contact: ${ORIGIN}/contact`);
  lines.push(`- Delivery policy: ${ORIGIN}/shipping-policy`);
  lines.push(`- Refund &amp; replacement policy: ${ORIGIN}/refund-policy`);
  lines.push(`- Privacy policy: ${ORIGIN}/privacy-policy`);
  lines.push(`- Terms of service: ${ORIGIN}/terms`);
  lines.push(`- Track order: ${ORIGIN}/track-order`);

  writeFileSync(resolve(PUBLIC_DIR, "llms.txt"), lines.join("\n") + "\n");

  console.log(`✓ sitemap.xml: ${urls.length} URLs`);
  console.log(`✓ llms.txt:    ${lines.length} lines`);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
