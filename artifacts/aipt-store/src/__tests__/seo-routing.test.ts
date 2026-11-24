// @vitest-environment node
// Synthetic tests for functions/lib/seo-routing.ts (PR #764 + follow-up).
// No network, no D1, no Cloudflare: D1 and HTMLRewriter are in-memory mocks.
import { test, expect } from "vitest";
import { handlePageRequest } from "../../../../functions/lib/seo-routing";
import { AIPT_COMMERCIAL_RULES } from "../../../../functions/lib/commercial-policy";
import { productPath, resolveProductId } from "../lib/product-path";

// --- HTMLRewriter mock: records handlers, leaves body untouched. -------------
const rewrites: string[] = [];
(globalThis as any).HTMLRewriter = class {
  on(selector: string, _h: unknown) { rewrites.push(selector); return this; }
  transform(r: Response) { return new Response(r.body, { status: r.status, headers: r.headers }); }
};


// --- Synthetic catalog (fixture names follow the commercial rule patterns). ---
type Row = { id: number; name: string; price_bdt: number; is_active: number; commercial_state: string; category_id: number; sort_order: number };
const ROWS: Row[] = [
  { id: 1, name: "ChatGPT Plus — Personal", price_bdt: 3390, is_active: 1, commercial_state: "CUSTOMER_OWNED", category_id: 1, sort_order: 0 },
  { id: 2, name: "ChatGPT Plus — Personal", price_bdt: 999,  is_active: 1, commercial_state: "CUSTOMER_OWNED", category_id: 1, sort_order: 1 }, // wrong price
  { id: 3, name: "ChatGPT Plus Shared Seat", price_bdt: 350, is_active: 1, commercial_state: "HOLD", category_id: 1, sort_order: 2 },       // no rule / HOLD
  { id: 5, name: "ChatGPT Plus Annual — Personal", price_bdt: 3390, is_active: 1, commercial_state: "CUSTOMER_OWNED", category_id: 1, sort_order: 3 }, // same rule as 1
  { id: 4, name: "Claude Pro — Personal",   price_bdt: 3390, is_active: 0, commercial_state: "CUSTOMER_OWNED", category_id: 2, sort_order: 0 }, // inactive
];

function mockDb(fail = false): any {
  return {
    prepare(sql: string) {
      if (fail) throw new Error("D1 unavailable");
      return {
        bind: (id: number) => ({ first: async () => ROWS.find((r) => r.id === id) ?? null }),
        all: async () => ({ results: ROWS.filter((r) => /is_active = 1/.test(sql) ? r.is_active === 1 : true) }),
      };
    },
  };
}

const shell = () => new Response("<html><head><title>x</title></head></html>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
const nextShell = async () => shell();
const req = (path: string, init: RequestInit = {}, host = "aipremium.tools") => new Request(`https://${host}${path}`, init);

test("www → 301 apex, keeps path and query", async () => {
  const r = await handlePageRequest(req("/products?category_id=2", {}, "www.aipremium.tools"), mockDb(), nextShell);
  expect(r.status).toBe(301);
  expect(r.headers.get("location")).toBe("https://aipremium.tools/products?category_id=2");
});

test("trailing slash → 301 bare path", async () => {
  const r = await handlePageRequest(req("/about/"), mockDb(), nextShell);
  expect(r.status).toBe(301);
  expect(r.headers.get("location")).toBe("https://aipremium.tools/about");
});

test("known static page → 200 indexable", async () => {
  const r = await handlePageRequest(req("/about"), mockDb(), nextShell);
  expect(r.status).toBe(200);
  expect(r.headers.get("x-robots-tag")).toBe(null);
});

test("unknown route → real 404 + noindex", async () => {
  const r = await handlePageRequest(req("/this-route-does-not-exist-xyz"), mockDb(), nextShell);
  expect(r.status).toBe(404);
  expect(r.headers.get("x-robots-tag")).toBe("noindex");
});

test("sellable product slug → 200 indexable", async () => {
  const r = await handlePageRequest(req("/products/chatgpt-plus"), mockDb(), nextShell);
  expect(r.status).toBe(200);
  expect(r.headers.get("x-robots-tag")).toBe(null);
});

test("numeric product URL → 301 to its slug, keeps query", async () => {
  const r = await handlePageRequest(req("/products/1?utm_source=x"), mockDb(), nextShell);
  expect(r.status).toBe(301);
  expect(r.headers.get("location")).toBe("https://aipremium.tools/products/chatgpt-plus?utm_source=x");
});

test("second row matching the same rule keeps its numeric URL (never redirected to another product)", async () => {
  const r = await handlePageRequest(req("/products/5"), mockDb(), nextShell);
  expect(r.status).toBe(200);
  expect(r.headers.get("location")).toBe(null);
});

test("known slug without a sellable product → 404; wrong case → 404", async () => {
  for (const p of ["/products/claude-pro", "/products/ChatGPT-Plus"]) {
    const r = await handlePageRequest(req(p), mockDb(), nextShell);
    expect(r.status, p).toBe(404);
  }
});

test("unknown slug never queries D1; known slug during an outage → 503", async () => {
  expect((await handlePageRequest(req("/products/not-a-plan"), mockDb(true), nextShell)).status).toBe(404);
  const orig = console.error; console.error = () => {};
  try {
    const r = await handlePageRequest(req("/products/chatgpt-plus"), mockDb(true), nextShell);
    expect(r.status).toBe(503);
  } finally { console.error = orig; }
});

test("slugs are unique and cannot be mistaken for numeric ids", () => {
  const ids = AIPT_COMMERCIAL_RULES.map((rule) => rule.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
});

test("storefront resolves numeric ids and slugs", () => {
  const products = [{ id: 1, slug: "chatgpt-plus" }, { id: 5 }];
  expect(resolveProductId("chatgpt-plus", products)).toBe(1);
  expect(resolveProductId("5", products)).toBe(5);
  expect(resolveProductId("nope", products)).toBe(undefined);
  expect(resolveProductId("chatgpt-plus", undefined)).toBe(undefined);
  expect(products.map(productPath)).toEqual(["/products/chatgpt-plus", "/products/5"]);
});

for (const [id, why] of [[2, "price mismatch"], [3, "HOLD/shared"], [4, "inactive"], [999, "missing"]] as const) {
  test(`product ${id} (${why}) → 404`, async () => {
    const r = await handlePageRequest(req(`/products/${id}`), mockDb(), nextShell);
    expect(r.status).toBe(404);
  });
}

test("non-numeric product slug → 404 (today's soft-404 case)", async () => {
  const r = await handlePageRequest(req("/products/this-does-not-exist-xyz"), mockDb(), nextShell);
  expect(r.status).toBe(404);
});

test("leading-zero product id /products/01 → 404 (no duplicate indexable URL)", async () => {
  const r = await handlePageRequest(req("/products/01"), mockDb(), nextShell);
  // Documents current behaviour; a fix should 301 to /products/1 or 404.
  expect(r.status).toBe(404);
});

test("cart → 200 noindex; admin deep route → 200 noindex", async () => {
  for (const p of ["/cart", "/admin/products/5/media", "/order-success/abc"]) {
    const r = await handlePageRequest(req(p), mockDb(), nextShell);
    expect(r.status).toBe(200, p);
    expect(r.headers.get("x-robots-tag")).toBe("noindex", p);
  }
});

test("missing static file served as SPA shell → 404", async () => {
  const r = await handlePageRequest(req("/images/missing.png"), mockDb(), nextShell);
  expect(r.status).toBe(404);
});

test("real static asset passes through untouched", async () => {
  const js = async () => new Response("console.log(1)", { status: 200, headers: { "content-type": "application/javascript" } });
  const r = await handlePageRequest(req("/assets/index-abc.js"), mockDb(), js);
  expect(r.status).toBe(200);
  expect(await r.text()).toBe("console.log(1)");
});

test("POST passes through to next()", async () => {
  let called = false;
  const r = await handlePageRequest(req("/contact", { method: "POST" }), mockDb(), async () => { called = true; return new Response("ok"); });
  expect(called).toBeTruthy();
  expect(r.status).toBe(200);
});

test("sitemap lists static pages + sellable products only", async () => {
  const r = await handlePageRequest(req("/sitemap.xml"), mockDb(), nextShell);
  const xml = await r.text();
  expect(r.headers.get("content-type") ?? "").toMatch(/xml/);
  expect(xml.includes("https://aipremium.tools/products/chatgpt-plus<")).toBeTruthy();
  expect(xml.includes("https://aipremium.tools/products/5<")).toBeTruthy();
  expect(xml.includes("/products/1<")).toBe(false);
  for (const id of [2, 3, 4]) expect(!xml.includes(`/products/${id}<`), `product ${id} must not be listed`).toBeTruthy();
  expect(!xml.includes("/cart<") && !xml.includes("/checkout<")).toBeTruthy();
});

test("unknown non-product route still 404s when D1 is down (no D1 lookup needed)", async () => {
  const r = await handlePageRequest(req("/nope"), mockDb(true), nextShell);
  expect(r.status).toBe(404);
});

test("D1 failure on a product route → logged 503 noindex no-store (not 200, not 404)", async () => {
  const errors: unknown[] = [];
  const orig = console.error; console.error = (...a: unknown[]) => { errors.push(a); };
  try {
    const r = await handlePageRequest(req("/products/999"), mockDb(true), nextShell);
    expect(r.status).toBe(503);
    expect(r.headers.get("retry-after")).toBe("60");
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("x-robots-tag")).toBe("noindex");
    expect(errors.length).toBe(1);      // now logged for monitoring
  } finally { console.error = orig; }
});

test("D1 failure on /sitemap.xml serves the static fallback and logs", async () => {
  const errors: unknown[] = [];
  const orig = console.error; console.error = (...x: unknown[]) => { errors.push(x); };
  try {
    const r = await handlePageRequest(req("/sitemap.xml"), mockDb(true), async () => new Response("<static/>", { headers: { "content-type": "application/xml" } }));
    expect(await r.text()).toBe("<static/>");
    expect(errors.length).toBe(1);
  } finally { console.error = orig; }
});
