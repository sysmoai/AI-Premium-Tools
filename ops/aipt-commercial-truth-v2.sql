-- AIPT Commercial Truth v2 — approved 2026-09-17
-- Idempotent data normalization for the existing production catalog.
-- This is intentionally NOT a schema migration: legacy rows are retained for
-- audit/history, while direct commerce is fail-closed unless explicitly mapped.

-- Default deny: preserve rows, disable direct sale, remove fake scarcity and
-- mark legacy credential-sharing offers prohibited.
UPDATE products
SET
  is_active = 0,
  is_featured = 0,
  stock_count = 0,
  commercial_state = CASE
    WHEN lower(name) LIKE '%shared%' THEN 'PROHIBITED'
    ELSE 'HOLD'
  END,
  seo_index = CASE
    WHEN lower(name) LIKE '%shared%' THEN 0
    ELSE seo_index
  END,
  updated_at = CAST(unixepoch('subsec') * 1000 AS INTEGER);

-- Approved customer-specific monthly plans. The public API independently
-- projects these same prices and checkout rejects any DB drift.
UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ChatGPT Plus%Personal%';
UPDATE products SET price_bdt=1299, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ChatGPT Go%Personal%';

UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Claude Pro%Personal%';
UPDATE products SET price_bdt=16790, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Claude Max 5x%Personal%';
UPDATE products SET price_bdt=33590, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Claude Max 20x%Personal%';

UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Google AI Pro%';
UPDATE products SET price_bdt=5090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'SuperGrok%Personal%' AND name NOT LIKE '%Lite%';

UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Perplexity Pro%Personal%';
UPDATE products SET price_bdt=33590, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Perplexity Max%Personal%';

UPDATE products SET price_bdt=5090, original_price_bdt=NULL, is_active=1, is_featured=1, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Midjourney Standard%Personal%';
UPDATE products SET price_bdt=10090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Midjourney Pro%Personal%';
UPDATE products SET price_bdt=20190, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Midjourney Mega%Personal%';

UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Ideogram Plus%Personal%';
UPDATE products SET price_bdt=10090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Ideogram Pro%Personal%';

UPDATE products SET price_bdt=2690, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Runway Standard%Personal%';
UPDATE products SET price_bdt=5890, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Runway Pro%Personal%';

UPDATE products SET price_bdt=1390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ElevenLabs Starter%Personal%';
UPDATE products SET price_bdt=3690, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ElevenLabs Creator%Personal%';
UPDATE products SET price_bdt=16690, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'ElevenLabs Pro%Personal%';

UPDATE products SET price_bdt=1990, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Suno AI Pro%Personal%';
UPDATE products SET price_bdt=5090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Suno AI Premier%Personal%';

UPDATE products SET price_bdt=1990, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'GitHub Copilot Pro%Personal%' AND name NOT LIKE '%Pro+%';
UPDATE products SET price_bdt=6590, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'GitHub Copilot Pro+%Personal%';
UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Cursor Pro%Personal%' AND name NOT LIKE '%Pro+%';
UPDATE products SET price_bdt=10090, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Cursor Pro+%Personal%';
UPDATE products SET price_bdt=3390, original_price_bdt=NULL, is_active=1, is_featured=0, stock_count=100, commercial_state='CUSTOMER_OWNED', plan_type='monthly', delivery_type='customer_account_activation', seo_index=1, updated_at=CAST(unixepoch('subsec')*1000 AS INTEGER) WHERE name LIKE 'Replit Core%Personal%';
