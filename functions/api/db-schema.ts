interface Env {
  DB: D1Database;
}

const EXPECTED_MIGRATIONS = ["0001_baseline.sql", "0002_catalog_media_foundation.sql"] as const;
const EXPECTED_TABLES = ["media_assets", "product_families", "product_media"] as const;
const EXPECTED_PRODUCT_COLUMNS = [
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const migrations = await env.DB
      .prepare("SELECT name FROM d1_migrations ORDER BY id")
      .all<{ name: string }>();
    const migrationNames = (migrations.results ?? []).map((row) => row.name);

    const schema = await env.DB
      .prepare("SELECT name, type FROM sqlite_schema WHERE type IN ('table','index') ORDER BY type, name")
      .all<{ name: string; type: string }>();
    const tables = new Set((schema.results ?? []).filter((row) => row.type === "table").map((row) => row.name));

    const productInfo = await env.DB.prepare("PRAGMA table_info(products)").all<{ name: string }>();
    const productColumns = new Set((productInfo.results ?? []).map((row) => row.name));

    const migrationsMatch =
      migrationNames.length === EXPECTED_MIGRATIONS.length &&
      EXPECTED_MIGRATIONS.every((name, index) => migrationNames[index] === name);
    const tablesMatch = EXPECTED_TABLES.every((name) => tables.has(name));
    const productColumnsMatch = EXPECTED_PRODUCT_COLUMNS.every((name) => productColumns.has(name));
    const healthy = migrationsMatch && tablesMatch && productColumnsMatch;

    return json(
      {
        status: healthy ? "ok" : "schema_mismatch",
        migration: migrationNames.at(-1) ?? null,
        migrations: migrationNames,
        checks: {
          migrations: migrationsMatch,
          catalog_media_tables: tablesMatch,
          product_columns: productColumnsMatch,
        },
      },
      healthy ? 200 : 503,
    );
  } catch {
    return json({ status: "unavailable" }, 503);
  }
};
