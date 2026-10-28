import { isCommerciallyValidProduct } from "./commercial-policy";

/**
 * Server-side SEO routing for the storefront SPA.
 *
 * Pages serves every unknown path as index.html with HTTP 200 (see
 * public/_redirects), so crawlers saw identical, indexable soft-404s with no
 * canonical. This layer runs before the SPA shell is returned and:
 *   - 301s www.aipremium.tools and trailing-slash URLs to one canonical form
 *   - returns a real 404 (noindex) for unknown routes and non-sellable products
 *   - writes a per-route <title>, description, canonical and og:url into the shell
 *   - serves /sitemap.xml from the same commercial allow-list as /api/products
 */

export const SITE_ORIGIN = "https://aipremium.tools";
const CANONICAL_HOST = "aipremium.tools";
const SITE_NAME = "AIPT — AI Premium Tools";

type PageMeta = { title: string; description: string; index: boolean };

const STATIC_PAGES: Record<string, PageMeta> = {
  "/": {
    title: "AIPT — AI Subscriptions in Bangladesh | ChatGPT, Claude, Midjourney",
    description:
      "AIPT is a Bangladesh-based store for selected premium AI subscriptions with current BDT pricing and provider-compatible activation support.",
    index: true,
  },
  "/products": {
    title: "All AI Tools — Premium AI Subscriptions in Bangladesh | AIPT",
    description:
      "Browse selected premium AI subscriptions with current BDT pricing. Pay via bKash, Nagad, Rocket, Upay or bank transfer.",
    index: true,
  },
  "/faq": {
    title: "FAQ — AI Subscriptions in Bangladesh | AIPT",
    description: "Answers to common questions about ordering, payment, activation and support at AIPT.",
    index: true,
  },
  "/about": {
    title: "About AIPT — Bangladesh's AI Subscription Store",
    description: "About AIPT, a Bangladesh-based store for selected premium AI subscriptions priced in BDT.",
    index: true,
  },
  "/contact": {
    title: "Contact AIPT — WhatsApp, Email & Support Hours",
    description: "Contact AIPT on WhatsApp, 10am–11pm Bangladesh time, for orders and support.",
    index: true,
  },
  "/shipping-policy": {
    title: "Delivery Policy — How AIPT Activates Your AI Subscription",
    description: "How AIPT verifies payment and confirms the supported activation method for each plan.",
    index: true,
  },
  "/refund-policy": {
    title: "Refund & Replacement Policy — AIPT",
    description: "AIPT refund and replacement policy for AI subscription orders.",
    index: true,
  },
  "/privacy-policy": {
    title: "Privacy Policy — AIPT",
    description: "How AIPT collects, uses and protects customer information.",
    index: true,
  },
  "/terms": {
    title: "Terms of Service — AIPT",
    description: "Terms of service for purchasing AI subscriptions from AIPT.",
    index: true,
  },
  "/track-order": {
    title: "Track Your Order — AIPT",
    description: "Check the status of your AIPT order with your order ID and phone number.",
    index: true,
  },
  "/cart": { title: "Your Cart — AIPT", description: "Review your AIPT order.", index: false },
  "/checkout": { title: "Checkout — AIPT", description: "Complete your AIPT order.", index: false },
};

const NOT_FOUND_META: PageMeta = {
  title: "Page Not Found — AIPT",
  description: "The page you're looking for doesn't exist. Browse the AIPT catalog instead.",
  index: false,
};

const SITEMAP_PATHS = Object.entries(STATIC_PAGES)
  .filter(([, meta]) => meta.index)
  .map(([path]) => path);

type ProductRow = {
  id: number;
  name: string;
  price_bdt: number;
  is_active: number;
  commercial_state?: string | null;
};

type Resolved = { status: 200 | 404; meta: PageMeta; canonicalPath: string | null };

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function redirect(location: string): Response {
  return new Response(null, { status: 301, headers: { location, "cache-control": "public, max-age=3600" } });
}

async function loadSellableProduct(db: D1Database, id: number): Promise<ProductRow | null> {
  const row = await db
    .prepare("SELECT id, name, price_bdt, is_active, commercial_state FROM products WHERE id = ?")
    .bind(id)
    .first<ProductRow>();
  return row && isCommerciallyValidProduct(row) ? row : null;
}

async function resolvePage(db: D1Database, pathname: string): Promise<Resolved> {
  const known = STATIC_PAGES[pathname];
  if (known) return { status: 200, meta: known, canonicalPath: known.index ? pathname : null };

  const product = /^\/products\/(\d+)$/.exec(pathname);
  if (product) {
    const row = await loadSellableProduct(db, Number(product[1]));
    if (!row) return { status: 404, meta: NOT_FOUND_META, canonicalPath: null };
    // Fixed template on purpose: D1 descriptions are not commercially reviewed.
    return {
      status: 200,
      meta: {
        title: `${row.name} in Bangladesh — BDT Price | AIPT`,
        description: `${row.name} from AIPT with current BDT pricing and provider-compatible activation support.`,
        index: true,
      },
      canonicalPath: pathname,
    };
  }

  // Routes the SPA handles but that must never be indexed.
  if (/^\/order-success\/[^/]+$/.test(pathname) || pathname === "/admin" || pathname.startsWith("/admin/")) {
    return { status: 200, meta: { title: SITE_NAME, description: "", index: false }, canonicalPath: null };
  }

  return { status: 404, meta: NOT_FOUND_META, canonicalPath: null };
}

class HeadWriter {
  constructor(private readonly resolved: Resolved) {}

  element(head: Element) {
    const { canonicalPath } = this.resolved;
    const tags: string[] = [];
    if (canonicalPath) {
      const href = escapeAttr(`${SITE_ORIGIN}${canonicalPath}`);
      tags.push(`<link rel="canonical" href="${href}" />`, `<meta property="og:url" content="${href}" />`);
    }
    if (tags.length) head.append(tags.join(""), { html: true });
  }
}

function rewriteShell(response: Response, resolved: Resolved): Response {
  const { meta } = resolved;
  const robots = meta.index ? "index,follow,max-image-preview:large" : "noindex,follow";
  const rewritten = new HTMLRewriter()
    .on("title", { element: (el) => el.setInnerContent(meta.title) })
    .on('meta[name="robots"]', { element: (el) => el.setAttribute("content", robots) })
    .on('meta[name="description"]', {
      element: (el) => {
        if (meta.description) el.setAttribute("content", meta.description);
      },
    })
    .on('meta[property="og:title"], meta[name="twitter:title"]', { element: (el) => el.setAttribute("content", meta.title) })
    .on("head", new HeadWriter(resolved))
    .transform(response);

  const headers = new Headers(rewritten.headers);
  if (!meta.index) headers.set("x-robots-tag", "noindex");
  return new Response(rewritten.body, { status: resolved.status, headers });
}

async function sitemap(db: D1Database): Promise<Response> {
  const rows = await db
    .prepare("SELECT id, name, price_bdt, is_active, commercial_state FROM products WHERE is_active = 1 ORDER BY category_id, sort_order, id")
    .all<ProductRow>();
  const productPaths = (rows.results ?? []).filter((row) => isCommerciallyValidProduct(row)).map((row) => `/products/${row.id}`);
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...SITEMAP_PATHS, ...productPaths].map((p) => `  <url><loc>${escapeXml(SITE_ORIGIN + p)}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

export async function handlePageRequest(
  request: Request,
  db: D1Database,
  next: () => Promise<Response>,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return next();
  const url = new URL(request.url);

  if (url.hostname === `www.${CANONICAL_HOST}`) {
    return redirect(`${SITE_ORIGIN}${url.pathname}${url.search}`);
  }

  if (url.pathname === "/sitemap.xml") {
    try {
      return await sitemap(db);
    } catch {
      return next(); // static public/sitemap.xml fallback
    }
  }

  // Static files (assets, robots.txt, llms.txt, images) pass straight through.
  const lastSegment = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  if (lastSegment.includes(".")) {
    // A missing file falls through _redirects to the SPA shell; report it as 404.
    const response = await next();
    const isShell = (response.headers.get("content-type") ?? "").includes("text/html");
    if (!isShell || lastSegment.endsWith(".html")) return response;
    return rewriteShell(response, { status: 404, meta: NOT_FOUND_META, canonicalPath: null });
  }

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    return redirect(`${url.origin}${url.pathname.replace(/\/+$/, "") || "/"}${url.search}`);
  }

  let resolved: Resolved;
  try {
    resolved = await resolvePage(db, url.pathname);
  } catch {
    return next(); // never take the storefront down because D1 is unavailable
  }

  const response = await next();
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
  return rewriteShell(response, resolved);
}
