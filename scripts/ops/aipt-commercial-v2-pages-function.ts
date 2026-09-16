interface Env {
  DB: D1Database;
  AIPT_COMMERCIAL_V2_NONCE?: string;
}

const REVISION = "aipt-pricing-v2-2026-09-17";

const RULES: Array<{ pattern: RegExp; price: number }> = [
  { pattern: /^ChatGPT Plus.*Personal$/i, price: 3390 },
  { pattern: /^ChatGPT Go.*Personal$/i, price: 1299 },
  { pattern: /^Claude Pro.*Personal$/i, price: 3390 },
  { pattern: /^Claude Max 5x.*Personal$/i, price: 16790 },
  { pattern: /^Claude Max 20x.*Personal$/i, price: 33590 },
  { pattern: /^Google AI Pro(?: \(Gemini Advanced\))?$/i, price: 3390 },
  { pattern: /^SuperGrok(?! Lite).*Personal$/i, price: 5090 },
  { pattern: /^Perplexity Pro.*Personal$/i, price: 3390 },
  { pattern: /^Perplexity Max.*Personal$/i, price: 33590 },
  { pattern: /^Midjourney Standard.*Personal$/i, price: 5090 },
  { pattern: /^Midjourney Pro.*Personal$/i, price: 10090 },
  { pattern: /^Midjourney Mega.*Personal$/i, price: 20190 },
  { pattern: /^Ideogram Plus.*Personal$/i, price: 3390 },
  { pattern: /^Ideogram Pro.*Personal$/i, price: 10090 },
  { pattern: /^Runway Standard.*Personal$/i, price: 2690 },
  { pattern: /^Runway Pro.*Personal$/i, price: 5890 },
  { pattern: /^ElevenLabs Starter.*Personal$/i, price: 1390 },
  { pattern: /^ElevenLabs Creator.*Personal$/i, price: 3690 },
  { pattern: /^ElevenLabs Pro.*Personal$/i, price: 16690 },
  { pattern: /^Suno AI Pro.*Personal$/i, price: 1990 },
  { pattern: /^Suno AI Premier.*Personal$/i, price: 5090 },
  { pattern: /^GitHub Copilot Pro(?!\+).*Personal$/i, price: 1990 },
  { pattern: /^GitHub Copilot Pro\+.*Personal$/i, price: 6590 },
  { pattern: /^Cursor Pro(?!\+).*Personal$/i, price: 3390 },
  { pattern: /^Cursor Pro\+.*Personal$/i, price: 10090 },
  { pattern: /^Replit Core.*Personal$/i, price: 3390 },
];

const REQUIRED: Array<{ needle: string; price: number }> = [
  { needle: "ChatGPT Plus", price: 3390 },
  { needle: "Claude Pro", price: 3390 },
  { needle: "Google AI Pro", price: 3390 },
  { needle: "Perplexity Pro", price: 3390 },
  { needle: "Midjourney Standard", price: 5090 },
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "x-aipt-commercial-revision": REVISION,
    },
  });
}

function authorized(request: Request, env: Env): boolean {
  const expected = env.AIPT_COMMERCIAL_V2_NONCE?.trim();
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!expected || !header.startsWith("Bearer ")) return false;
  return header.slice(7).trim() === expected;
}

function expectedPrice(name: string): number | null {
  return RULES.find((rule) => rule.pattern.test(name))?.price ?? null;
}

async function assertSchema(db: D1Database) {
  const columns = await db.prepare("PRAGMA table_info(products)").all<{ name: string }>();
  const names = new Set((columns.results ?? []).map((row) => row.name));
  const required = [
    "id",
    "name",
    "price_bdt",
    "original_price_bdt",
    "is_active",
    "is_featured",
    "stock_count",
    "commercial_state",
    "plan_type",
    "delivery_type",
    "seo_index",
    "updated_at",
  ];
  const missing = required.filter((name) => !names.has(name));
  if (missing.length) throw new Error(`Required products columns missing: ${missing.join(", ")}`);
}

async function snapshot(db: D1Database) {
  await assertSchema(db);
  const total = await db.prepare("SELECT COUNT(*) AS count FROM products").first<{ count: number }>();
  const active = await db.prepare("SELECT COUNT(*) AS count FROM products WHERE is_active = 1").first<{ count: number }>();
  const sharedActive = await db
    .prepare("SELECT COUNT(*) AS count FROM products WHERE is_active = 1 AND lower(name) LIKE '%shared%'")
    .first<{ count: number }>();
  const rows = await db
    .prepare("SELECT id, name, price_bdt, is_active, commercial_state FROM products WHERE is_active = 1 ORDER BY id")
    .all<{ id: number; name: string; price_bdt: number; is_active: number; commercial_state: string }>();
  return {
    total: Number(total?.count ?? 0),
    active: Number(active?.count ?? 0),
    sharedActive: Number(sharedActive?.count ?? 0),
    rows: rows.results ?? [],
  };
}

function verify(snapshotValue: Awaited<ReturnType<typeof snapshot>>) {
  const errors: string[] = [];
  if (snapshotValue.active < 10) errors.push(`Expected at least 10 active approved plans, found ${snapshotValue.active}`);
  if (snapshotValue.sharedActive !== 0) errors.push(`Shared offers remained active: ${snapshotValue.sharedActive}`);

  for (const row of snapshotValue.rows) {
    const expected = expectedPrice(String(row.name));
    if (expected === null) errors.push(`Unmapped active product: ${row.name}`);
    else if (Number(row.price_bdt) !== expected) errors.push(`Price mismatch for ${row.name}: ${row.price_bdt} != ${expected}`);
    if (row.commercial_state !== "CUSTOMER_OWNED") {
      errors.push(`Unexpected commercial_state for ${row.name}: ${row.commercial_state}`);
    }
  }

  for (const required of REQUIRED) {
    if (!snapshotValue.rows.some((row) => String(row.name).includes(required.needle) && Number(row.price_bdt) === required.price)) {
      errors.push(`Required approved product missing: ${required.needle}`);
    }
  }
  return errors;
}

function statements(db: D1Database): D1PreparedStatement[] {
  const sql = [
    `UPDATE products SET
      is_active = 0,
      is_featured = 0,
      stock_count = 0,
      commercial_state = CASE WHEN lower(name) LIKE '%shared%' THEN 'PROHIBITED' ELSE 'HOLD' END,
      seo_index = CASE WHEN lower(name) LIKE '%shared%' THEN 0 ELSE seo_index END,
      updated_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)`,

    `UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ChatGPT Plus%Personal%'`,
    `UPDATE products SET price_bdt=1299, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ChatGPT Go%Personal%'`,

    `UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Claude Pro%Personal%'`,
    `UPDATE products SET price_bdt=16790, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Claude Max 5x%Personal%'`,
    `UPDATE products SET price_bdt=33590, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Claude Max 20x%Personal%'`,

    `UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Google AI Pro%'`,
    `UPDATE products SET price_bdt=5090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'SuperGrok%Personal%' AND name NOT LIKE '%Lite%'`,

    `UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Perplexity Pro%Personal%'`,
    `UPDATE products SET price_bdt=33590, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Perplexity Max%Personal%'`,

    `UPDATE products SET price_bdt=5090, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Midjourney Standard%Personal%'`,
    `UPDATE products SET price_bdt=10090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Midjourney Pro%Personal%'`,
    `UPDATE products SET price_bdt=20190, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Midjourney Mega%Personal%'`,

    `UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Ideogram Plus%Personal%'`,
    `UPDATE products SET price_bdt=10090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Ideogram Pro%Personal%'`,

    `UPDATE products SET price_bdt=2690, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Runway Standard%Personal%'`,
    `UPDATE products SET price_bdt=5890, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Runway Pro%Personal%'`,

    `UPDATE products SET price_bdt=1390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ElevenLabs Starter%Personal%'`,
    `UPDATE products SET price_bdt=3690, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ElevenLabs Creator%Personal%'`,
    `UPDATE products SET price_bdt=16690, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ElevenLabs Pro%Personal%'`,

    `UPDATE products SET price_bdt=1990, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Suno AI Pro%Personal%'`,
    `UPDATE products SET price_bdt=5090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Suno AI Premier%Personal%'`,

    `UPDATE products SET price_bdt=1990, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'GitHub Copilot Pro%Personal%' AND name NOT LIKE '%Pro+%'`,
    `UPDATE products SET price_bdt=6590, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'GitHub Copilot Pro+%Personal%'`,
    `UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Cursor Pro%Personal%' AND name NOT LIKE '%Pro+%'`,
    `UPDATE products SET price_bdt=10090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Cursor Pro+%Personal%'`,
    `UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Replit Core%Personal%'`,
  ];
  return sql.map((statement) => db.prepare(statement));
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);

  let body: { action?: string } = {};
  try {
    body = (await request.json()) as { action?: string };
  } catch {}

  const before = await snapshot(env.DB);
  if (body.action === "probe") {
    return json({
      ok: true,
      revision: REVISION,
      before: { total: before.total, active: before.active, sharedActive: before.sharedActive },
    });
  }
  if (body.action !== "apply") return json({ error: "Unsupported action" }, 400);

  await env.DB.batch(statements(env.DB));
  const after = await snapshot(env.DB);
  const errors = verify(after);
  if (errors.length) {
    return json({
      ok: false,
      revision: REVISION,
      error: "Post-normalization verification failed",
      errors,
      after: { total: after.total, active: after.active, sharedActive: after.sharedActive },
    }, 500);
  }

  return json({
    ok: true,
    revision: REVISION,
    before: { total: before.total, active: before.active, sharedActive: before.sharedActive },
    after: { total: after.total, active: after.active, sharedActive: after.sharedActive },
  });
};
