interface Env {
  DB: D1Database;
  AIPT_MIGRATION_NONCE?: string;
}

const BASE_TABLES = ["categories", "products", "customers", "orders", "order_items", "reviews"] as const;
const NEW_TABLES = ["media_assets", "product_families", "product_media"] as const;
const NEW_PRODUCT_COLUMNS = [
  "slug",
  "sku",
  "product_family_id",
  "short_description",
  "plan_type",
  "delivery_type",
  "commercial_state",
  "sort_order",
  "seo_title",
  "seo_description",
  "seo_index",
  "updated_at",
] as const;
const NEW_INDEXES = [
  "idx_media_assets_type",
  "idx_media_assets_status",
  "idx_media_assets_created_at",
  "idx_product_families_category_id",
  "idx_product_families_status",
  "idx_products_slug_unique",
  "idx_products_sku_unique",
  "idx_products_family_id",
  "idx_products_commercial_state",
  "idx_products_sort_order",
  "idx_product_media_product_id",
  "idx_product_media_asset_id",
  "idx_product_media_sort_order",
] as const;
const KNOWN_MIGRATIONS = ["0001_baseline.sql", "0002_catalog_media_foundation.sql"] as const;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}

function authorized(request: Request, env: Env): boolean {
  const expected = env.AIPT_MIGRATION_NONCE?.trim();
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!expected || !header.startsWith("Bearer ")) return false;
  return header.slice(7).trim() === expected;
}

async function inspect(db: D1Database) {
  const schema = await db
    .prepare("SELECT name, type FROM sqlite_schema WHERE type IN ('table','index') ORDER BY type, name")
    .all<{ name: string; type: string }>();
  const tables = new Set((schema.results ?? []).filter((row) => row.type === "table").map((row) => row.name));
  const indexes = new Set((schema.results ?? []).filter((row) => row.type === "index").map((row) => row.name));

  const productInfo = await db.prepare("PRAGMA table_info(products)").all<{ name: string }>();
  const productColumns = new Set((productInfo.results ?? []).map((row) => row.name));

  const counts: Record<string, number> = {};
  for (const table of BASE_TABLES) {
    if (!tables.has(table)) continue;
    const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first<{ count: number }>();
    counts[table] = Number(row?.count ?? 0);
  }

  let ledger: string[] = [];
  if (tables.has("d1_migrations")) {
    const rows = await db.prepare("SELECT name FROM d1_migrations ORDER BY id").all<{ name: string }>();
    ledger = (rows.results ?? []).map((row) => row.name);
  }

  const missingBaseTables = BASE_TABLES.filter((name) => !tables.has(name));
  const presentNewTables = NEW_TABLES.filter((name) => tables.has(name));
  const presentNewColumns = NEW_PRODUCT_COLUMNS.filter((name) => productColumns.has(name));
  const presentNewIndexes = NEW_INDEXES.filter((name) => indexes.has(name));

  const pre = presentNewTables.length === 0 && presentNewColumns.length === 0 && presentNewIndexes.length === 0;
  const migrated =
    presentNewTables.length === NEW_TABLES.length &&
    presentNewColumns.length === NEW_PRODUCT_COLUMNS.length &&
    presentNewIndexes.length === NEW_INDEXES.length;
  const state =
    missingBaseTables.length > 0 ? "invalid-base" : pre ? "pre-0002" : migrated ? "migrated-0002" : "partial-0002";

  return {
    state,
    counts,
    missingBaseTables,
    presentNewTables,
    presentNewColumns,
    presentNewIndexes,
    ledger,
  };
}

function sameCounts(a: Record<string, number>, b: Record<string, number>): boolean {
  return BASE_TABLES.every((table) => a[table] === b[table]);
}

function migrationStatements(db: D1Database): D1PreparedStatement[] {
  const sql = [
    `CREATE TABLE IF NOT EXISTS d1_migrations(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0001_baseline.sql')`,
    `CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      r2_key TEXT NOT NULL UNIQUE,
      asset_type TEXT NOT NULL CHECK (asset_type IN ('image','video','document','other')),
      mime_type TEXT NOT NULL,
      original_filename TEXT,
      size_bytes INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      duration_ms INTEGER,
      alt_text TEXT,
      caption TEXT,
      poster_asset_id INTEGER REFERENCES media_assets(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','deleted')),
      created_by TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(asset_type)`,
    `CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status)`,
    `CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at)`,
    `CREATE TABLE IF NOT EXISTS product_families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      provider TEXT,
      category_id INTEGER REFERENCES categories(id),
      short_description TEXT,
      description TEXT,
      logo_asset_id INTEGER REFERENCES media_assets(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
      seo_title TEXT,
      seo_description TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_product_families_category_id ON product_families(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_families_status ON product_families(status)`,
    `ALTER TABLE products ADD COLUMN slug TEXT`,
    `ALTER TABLE products ADD COLUMN sku TEXT`,
    `ALTER TABLE products ADD COLUMN product_family_id INTEGER REFERENCES product_families(id)`,
    `ALTER TABLE products ADD COLUMN short_description TEXT`,
    `ALTER TABLE products ADD COLUMN plan_type TEXT`,
    `ALTER TABLE products ADD COLUMN delivery_type TEXT`,
    `ALTER TABLE products ADD COLUMN commercial_state TEXT NOT NULL DEFAULT 'HOLD' CHECK (commercial_state IN ('CUSTOMER_OWNED','AUTHORIZED_SEAT','HOLD','PROHIBITED'))`,
    `ALTER TABLE products ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN seo_title TEXT`,
    `ALTER TABLE products ADD COLUMN seo_description TEXT`,
    `ALTER TABLE products ADD COLUMN seo_index INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE products ADD COLUMN updated_at INTEGER`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique ON products(sku) WHERE sku IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_products_family_id ON products(product_family_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_commercial_state ON products(commercial_state)`,
    `CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order)`,
    `CREATE TABLE IF NOT EXISTS product_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      media_asset_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'gallery' CHECK (role IN ('logo','primary','gallery','thumbnail','hero','video','poster','documentation')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
      UNIQUE(product_id, media_asset_id, role)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_media_asset_id ON product_media(media_asset_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_media_sort_order ON product_media(product_id, sort_order)`,
    `INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0002_catalog_media_foundation.sql')`,
  ];
  return sql.map((statement) => db.prepare(statement));
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401);

  let body: { action?: string } = {};
  try {
    body = await request.json<{ action?: string }>();
  } catch {}

  const before = await inspect(env.DB);
  const unknownLedger = before.ledger.filter(
    (name) => !KNOWN_MIGRATIONS.includes(name as (typeof KNOWN_MIGRATIONS)[number]),
  );

  if (body.action === "probe") return json({ ok: true, ...before, unknownLedger });
  if (body.action !== "apply") return json({ error: "Unsupported action" }, 400);
  if (before.state === "invalid-base") return json({ error: "Required base tables are missing", before }, 409);
  if (before.state === "partial-0002") return json({ error: "Refusing to modify a partially migrated database", before }, 409);
  if (unknownLedger.length > 0) return json({ error: "Unknown migration ledger entries present", unknownLedger }, 409);

  if (before.state === "pre-0002") {
    await env.DB.batch(migrationStatements(env.DB));
  } else if (!before.ledger.includes("0001_baseline.sql") || !before.ledger.includes("0002_catalog_media_foundation.sql")) {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS d1_migrations(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      env.DB.prepare("INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0001_baseline.sql')"),
      env.DB.prepare("INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0002_catalog_media_foundation.sql')"),
    ]);
  }

  const after = await inspect(env.DB);
  if (after.state !== "migrated-0002") return json({ error: "Post-migration schema verification failed", before, after }, 500);
  if (!after.ledger.includes("0001_baseline.sql") || !after.ledger.includes("0002_catalog_media_foundation.sql")) {
    return json({ error: "Migration ledger verification failed", before, after }, 500);
  }
  if (!sameCounts(before.counts, after.counts)) {
    return json({ error: "Base table row counts changed unexpectedly", before: before.counts, after: after.counts }, 500);
  }

  return json({
    ok: true,
    applied: before.state === "pre-0002",
    before: { state: before.state, counts: before.counts, ledger: before.ledger },
    after: { state: after.state, counts: after.counts, ledger: after.ledger },
  });
};
