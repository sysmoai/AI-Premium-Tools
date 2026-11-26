import {
  AIPT_COMMERCIAL_REVISION,
  AIPT_COMMERCIAL_RULES,
  AIPT_REQUIRED_PRODUCTS,
  findCommercialRule,
} from "./lib/commercial-policy";

interface Env {
  DB: D1Database;
  AIPT_COMMERCIAL_V2_NONCE?: string;
}

const SAFE_DESCRIPTION =
  "AIPT approved direct-sale plan with current BDT pricing and provider-compatible activation. Provider features, limits, taxes and availability follow the provider's current terms.";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "x-aipt-commercial-revision": AIPT_COMMERCIAL_REVISION,
    },
  });
}

function authorized(request: Request, env: Env): boolean {
  const expected = env.AIPT_COMMERCIAL_V2_NONCE?.trim();
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!expected || !header.startsWith("Bearer ")) return false;
  return header.slice(7).trim() === expected;
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function assertSchema(db: D1Database) {
  const columns = await db.prepare("PRAGMA table_info(products)").all<{ name: string }>();
  const names = new Set((columns.results ?? []).map((row) => row.name));
  const required = [
    "id",
    "name",
    "description",
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
    .prepare(
      `SELECT id, name, description, price_bdt, is_active, is_featured,
              commercial_state, plan_type, delivery_type
       FROM products WHERE is_active = 1 ORDER BY id`,
    )
    .all<{
      id: number;
      name: string;
      description: string | null;
      price_bdt: number;
      is_active: number;
      is_featured: number;
      commercial_state: string;
      plan_type: string | null;
      delivery_type: string | null;
    }>();
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
    const rule = findCommercialRule(String(row.name));
    if (!rule) {
      errors.push(`Unmapped active product: ${row.name}`);
      continue;
    }
    if (Number(row.price_bdt) !== rule.priceBdt) {
      errors.push(`Price mismatch for ${row.name}: ${row.price_bdt} != ${rule.priceBdt}`);
    }
    if (row.commercial_state !== rule.state) {
      errors.push(`Commercial-state mismatch for ${row.name}: ${row.commercial_state} != ${rule.state}`);
    }
    if (row.plan_type !== rule.planType) {
      errors.push(`Plan-type mismatch for ${row.name}: ${row.plan_type} != ${rule.planType}`);
    }
    if (row.delivery_type !== rule.deliveryType) {
      errors.push(`Delivery-type mismatch for ${row.name}: ${row.delivery_type} != ${rule.deliveryType}`);
    }
    if (/shared/i.test(row.name)) errors.push(`Shared credential offer remained active: ${row.name}`);
    if (/\bAIPS\b/i.test(String(row.description ?? ""))) errors.push(`Cross-brand AIPS description remained active: ${row.name}`);
    if (/৳\s*[0-9]/.test(String(row.description ?? ""))) errors.push(`Stale inline BDT price remained in active description: ${row.name}`);
  }

  for (const needle of AIPT_REQUIRED_PRODUCTS) {
    if (!snapshotValue.rows.some((row) => String(row.name).includes(needle))) {
      errors.push(`Required approved product missing: ${needle}`);
    }
  }
  return errors;
}

function statements(db: D1Database): D1PreparedStatement[] {
  const base = db.prepare(
    `UPDATE products SET
      is_active = 0,
      is_featured = 0,
      stock_count = 0,
      commercial_state = CASE WHEN lower(name) LIKE '%shared%' THEN 'PROHIBITED' ELSE 'HOLD' END,
      seo_index = CASE WHEN lower(name) LIKE '%shared%' THEN 0 ELSE seo_index END,
      updated_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)`,
  );

  const approved = AIPT_COMMERCIAL_RULES.map((rule) => {
    const nameAssignment = rule.canonicalName ? `name=${sqlLiteral(rule.canonicalName)},` : "";
    const sql = `UPDATE products SET
      ${nameAssignment}
      description=${sqlLiteral(SAFE_DESCRIPTION)},
      price_bdt=${rule.priceBdt},
      original_price_bdt=NULL,
      is_active=1,
      is_featured=${rule.featured ? 1 : 0},
      stock_count=100,
      commercial_state=${sqlLiteral(rule.state)},
      plan_type=${sqlLiteral(rule.planType)},
      delivery_type=${sqlLiteral(rule.deliveryType)},
      seo_index=1,
      updated_at=CAST(unixepoch('subsec') * 1000 AS INTEGER)
      WHERE ${rule.whereSql}`;
    return db.prepare(sql);
  });

  return [base, ...approved];
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
      revision: AIPT_COMMERCIAL_REVISION,
      before: { total: before.total, active: before.active, sharedActive: before.sharedActive },
    });
  }
  if (body.action !== "apply") return json({ error: "Unsupported action" }, 400);

  await env.DB.batch(statements(env.DB));
  const after = await snapshot(env.DB);
  const errors = verify(after);
  if (errors.length) {
    return json(
      {
        ok: false,
        revision: AIPT_COMMERCIAL_REVISION,
        error: "Post-normalization verification failed",
        errors,
        after: { total: after.total, active: after.active, sharedActive: after.sharedActive },
      },
      500,
    );
  }

  return json({
    ok: true,
    revision: AIPT_COMMERCIAL_REVISION,
    before: { total: before.total, active: before.active, sharedActive: before.sharedActive },
    after: { total: after.total, active: after.active, sharedActive: after.sharedActive },
  });
};
