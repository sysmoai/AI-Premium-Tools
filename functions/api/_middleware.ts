interface Env {
  DB: D1Database;
}

type CommercialRule = {
  id: string;
  pattern: RegExp;
  priceBdt: number;
  featured?: boolean;
};

const REVISION = "aipt-pricing-v2-2026-09-17";

// Public commerce is fail-closed. Only plans that map cleanly to the approved
// master register are exposed as directly purchasable. Shared credentials,
// bundles, dynamic/localized prices, legacy tiers, team-seat ambiguity and
// unverified products remain available only through support/inquiry flows.
const RULES: CommercialRule[] = [
  { id: "chatgpt-plus", pattern: /^ChatGPT Plus.*Personal$/i, priceBdt: 3390, featured: true },
  { id: "chatgpt-go", pattern: /^ChatGPT Go.*Personal$/i, priceBdt: 1299, featured: true },
  { id: "claude-pro", pattern: /^Claude Pro.*Personal$/i, priceBdt: 3390, featured: true },
  { id: "claude-max-5x", pattern: /^Claude Max 5x.*Personal$/i, priceBdt: 16790 },
  { id: "claude-max-20x", pattern: /^Claude Max 20x.*Personal$/i, priceBdt: 33590 },
  { id: "google-ai-pro", pattern: /^Google AI Pro(?: \(Gemini Advanced\))?$/i, priceBdt: 3390, featured: true },
  { id: "supergrok", pattern: /^SuperGrok(?! Lite).*Personal$/i, priceBdt: 5090 },
  { id: "perplexity-pro", pattern: /^Perplexity Pro.*Personal$/i, priceBdt: 3390, featured: true },
  { id: "perplexity-max", pattern: /^Perplexity Max.*Personal$/i, priceBdt: 33590 },
  { id: "midjourney-standard", pattern: /^Midjourney Standard.*Personal$/i, priceBdt: 5090, featured: true },
  { id: "midjourney-pro", pattern: /^Midjourney Pro.*Personal$/i, priceBdt: 10090 },
  { id: "midjourney-mega", pattern: /^Midjourney Mega.*Personal$/i, priceBdt: 20190 },
  { id: "ideogram-plus", pattern: /^Ideogram Plus.*Personal$/i, priceBdt: 3390 },
  { id: "ideogram-pro", pattern: /^Ideogram Pro.*Personal$/i, priceBdt: 10090 },
  { id: "runway-standard", pattern: /^Runway Standard.*Personal$/i, priceBdt: 2690 },
  { id: "runway-pro", pattern: /^Runway Pro.*Personal$/i, priceBdt: 5890 },
  { id: "elevenlabs-starter", pattern: /^ElevenLabs Starter.*Personal$/i, priceBdt: 1390 },
  { id: "elevenlabs-creator", pattern: /^ElevenLabs Creator.*Personal$/i, priceBdt: 3690 },
  { id: "elevenlabs-pro", pattern: /^ElevenLabs Pro.*Personal$/i, priceBdt: 16690 },
  { id: "suno-pro", pattern: /^Suno AI Pro.*Personal$/i, priceBdt: 1990 },
  { id: "suno-premier", pattern: /^Suno AI Premier.*Personal$/i, priceBdt: 5090 },
  { id: "github-copilot-pro", pattern: /^GitHub Copilot Pro(?!\+).*Personal$/i, priceBdt: 1990 },
  { id: "github-copilot-proplus", pattern: /^GitHub Copilot Pro\+.*Personal$/i, priceBdt: 6590 },
  { id: "cursor-pro", pattern: /^Cursor Pro(?!\+).*Personal$/i, priceBdt: 3390 },
  { id: "cursor-proplus", pattern: /^Cursor Pro\+.*Personal$/i, priceBdt: 10090 },
  { id: "replit-core", pattern: /^Replit Core.*Personal$/i, priceBdt: 3390 },
];

function ruleFor(name: unknown): CommercialRule | null {
  const value = String(name ?? "").trim();
  return RULES.find((rule) => rule.pattern.test(value)) ?? null;
}

function safeProduct<T extends Record<string, unknown>>(product: T, rule: CommercialRule): T {
  const duration = Number(product.duration_days ?? 30) || 30;
  return {
    ...product,
    price_bdt: rule.priceBdt,
    original_price_bdt: undefined,
    is_active: true,
    is_featured: !!rule.featured,
    stock_count: undefined,
    description: `Supported ${String(product.name)} activation for ${duration} days. AIPT uses customer-specific or provider-supported access where available. Current provider limits and included features apply; local BDT payment and activation support are included.`,
    features: [
      "Supported official paid plan",
      "Customer-specific or provider-supported access where available",
      "Current provider limits and terms apply",
      "Local BDT payment and activation support",
    ],
  } as T;
}

function responseJson(data: unknown, status = 200, base?: Response): Response {
  const headers = new Headers(base?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-aipt-commercial-revision", REVISION);
  return new Response(JSON.stringify(data), { status, headers });
}

function isPublic(request: Request): boolean {
  return !request.headers.get("authorization");
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const apiPath = url.pathname.replace(/^\/api/, "") || "/";

  // Checkout preflight: never allow raw D1 price drift, legacy shared offers,
  // unsupported bundles, or unverified plans to reach the order writer.
  if (request.method === "POST" && apiPath === "/orders") {
    let body: { items?: Array<{ product_id?: number; quantity?: number }> };
    try {
      body = await request.clone().json() as { items?: Array<{ product_id?: number; quantity?: number }> };
    } catch {
      return responseJson({ error: "Invalid order payload" }, 400);
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return context.next();
    }

    for (const item of body.items) {
      const id = Number(item.product_id);
      if (!Number.isInteger(id) || id <= 0) {
        return responseJson({ error: "Invalid product" }, 400);
      }
      const row = await env.DB
        .prepare("SELECT id, name, price_bdt, is_active FROM products WHERE id = ?")
        .bind(id)
        .first<{ id: number; name: string; price_bdt: number; is_active: number }>();
      const rule = row ? ruleFor(row.name) : null;
      if (!row || !rule || !row.is_active) {
        return responseJson(
          { error: "This offer requires current price/access confirmation. Please contact AIPT before ordering." },
          409,
        );
      }
      if (Number(row.price_bdt) !== rule.priceBdt) {
        return responseJson(
          { error: "PRICE REVIEW REQUIRED: catalog price is not synchronized with the approved AIPT register." },
          409,
        );
      }
    }
  }

  const downstream = await context.next();
  if (!isPublic(request) || request.method !== "GET" || !downstream.ok) return downstream;

  // Public catalog list: expose only approved, active direct-sale plans and
  // project their approved BDT price. Raw D1 remains available to admins.
  if (apiPath === "/products") {
    try {
      const data = await downstream.clone().json() as unknown;
      if (!Array.isArray(data)) return downstream;
      const safe = data
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .flatMap((item) => {
          const rule = ruleFor(item.name);
          return rule && item.is_active ? [safeProduct(item, rule)] : [];
        });
      return responseJson(safe, 200, downstream);
    } catch {
      return downstream;
    }
  }

  // Public product detail: legacy/shared/unverified deep links must not leak a
  // stale price or purchase CTA. Keep the database row for audit/history, but
  // return a safe unavailable response until an approved mapping exists.
  if (/^\/products\/\d+$/.test(apiPath)) {
    try {
      const item = await downstream.clone().json() as Record<string, unknown>;
      const rule = ruleFor(item?.name);
      if (!rule || !item?.is_active) {
        return responseJson(
          { error: "This legacy offer is no longer available for direct purchase. Contact AIPT for the current supported option." },
          404,
          downstream,
        );
      }
      return responseJson(safeProduct(item, rule), 200, downstream);
    } catch {
      return downstream;
    }
  }

  // Category counts should describe the governed public catalog, not hidden
  // legacy rows retained in D1 for audit/history.
  if (apiPath === "/categories") {
    try {
      const categories = await downstream.clone().json() as Array<Record<string, unknown>>;
      if (!Array.isArray(categories)) return downstream;
      const rows = await env.DB
        .prepare("SELECT name, category_id, is_active FROM products")
        .all<{ name: string; category_id: number; is_active: number }>();
      const counts = new Map<number, number>();
      for (const row of rows.results ?? []) {
        if (!row.is_active || !ruleFor(row.name)) continue;
        counts.set(Number(row.category_id), (counts.get(Number(row.category_id)) ?? 0) + 1);
      }
      return responseJson(
        categories.map((category) => ({
          ...category,
          product_count: counts.get(Number(category.id)) ?? 0,
        })),
        200,
        downstream,
      );
    } catch {
      return downstream;
    }
  }

  return downstream;
};
