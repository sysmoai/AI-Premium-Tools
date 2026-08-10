-- Additive catalog/media foundation for AIPT.
-- This migration does not delete, rename, or rewrite existing rows.

ALTER TABLE products ADD COLUMN slug TEXT;
ALTER TABLE products ADD COLUMN sku TEXT;
ALTER TABLE products ADD COLUMN product_family_id INTEGER REFERENCES product_families(id);
ALTER TABLE products ADD COLUMN short_description TEXT;
ALTER TABLE products ADD COLUMN plan_type TEXT;
ALTER TABLE products ADD COLUMN delivery_type TEXT;
ALTER TABLE products ADD COLUMN commercial_state TEXT NOT NULL DEFAULT 'HOLD' CHECK (commercial_state IN ('CUSTOMER_OWNED','AUTHORIZED_SEAT','HOLD','PROHIBITED'));
ALTER TABLE products ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN seo_title TEXT;
ALTER TABLE products ADD COLUMN seo_description TEXT;
ALTER TABLE products ADD COLUMN seo_index INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN updated_at INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_family_id ON products(product_family_id);
CREATE INDEX IF NOT EXISTS idx_products_commercial_state ON products(commercial_state);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);

CREATE TABLE IF NOT EXISTS product_families (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  provider TEXT,
  category_id INTEGER REFERENCES categories(id),
  short_description TEXT,
  description TEXT,
  logo_asset_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
  seo_title TEXT,
  seo_description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_product_families_category_id ON product_families(category_id);
CREATE INDEX IF NOT EXISTS idx_product_families_status ON product_families(status);

CREATE TABLE IF NOT EXISTS media_assets (
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
);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);

CREATE TABLE IF NOT EXISTS product_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_asset_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'gallery' CHECK (role IN ('logo','primary','gallery','thumbnail','hero','video','poster','documentation')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE(product_id, media_asset_id, role)
);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_asset_id ON product_media(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_product_media_sort_order ON product_media(product_id, sort_order);
