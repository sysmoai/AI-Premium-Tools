#!/usr/bin/env node

const endpoint = 'https://aipremium.tools/api/products';
const allowedStates = new Set(['CUSTOMER_OWNED','AUTHORIZED_SEAT','HOLD','PROHIBITED']);
const response = await fetch(endpoint, {
  headers: { 'user-agent': 'AIPT-Commercial-Inventory-Audit/1.0', accept: 'application/json' },
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`Products API returned HTTP ${response.status}`);
const products = await response.json();
if (!Array.isArray(products) || products.length === 0) throw new Error('Products API did not return a non-empty array');

const active = products.filter((p) => p?.is_active !== false && Number(p?.is_active ?? 1) !== 0);
const rows = active.map((p) => {
  const rawState = p?.commercial_state;
  const state = rawState == null || String(rawState).trim() === ''
    ? 'NOT_EXPOSED'
    : String(rawState).trim().toUpperCase();
  return {
    id: Number(p?.id),
    name: String(p?.name ?? '').trim(),
    category: String(p?.category_name ?? p?.category ?? '').trim(),
    commercial_state: state,
    commercial_state_exposed: state !== 'NOT_EXPOSED',
    plan_type: String(p?.plan_type ?? '').trim(),
    delivery_type: String(p?.delivery_type ?? '').trim(),
    slug: String(p?.slug ?? '').trim(),
    price_bdt: Number(p?.price_bdt),
  };
}).sort((a,b) => a.id - b.id);

const structurallyInvalid = rows.filter((r) => !Number.isInteger(r.id) || !r.name);
if (structurallyInvalid.length) throw new Error(`Catalog inventory has ${structurallyInvalid.length} structurally invalid row(s)`);
const exposedInvalidStates = rows.filter((r) => r.commercial_state_exposed && !allowedStates.has(r.commercial_state));
if (exposedInvalidStates.length) throw new Error(`Public API exposes ${exposedInvalidStates.length} invalid commercial state(s)`);

const counts = Object.fromEntries([...allowedStates, 'NOT_EXPOSED'].map((state) => [state, rows.filter((r) => r.commercial_state === state).length]));
const publicKeys = [...new Set(products.flatMap((p) => Object.keys(p || {})))].sort();
const summary = {
  captured_at: new Date().toISOString(),
  endpoint,
  total_products: products.length,
  active_products: rows.length,
  public_product_keys: publicKeys,
  commercial_state_counts: counts,
  rows,
};

await import('node:fs').then(({writeFileSync, appendFileSync}) => {
  writeFileSync('/tmp/aipt-commercial-inventory.json', JSON.stringify(summary, null, 2));
  const lines = [
    '# AIPT-0103 production commercial inventory',
    '',
    `Captured: ${summary.captured_at}`,
    `Products API rows: ${summary.total_products}`,
    `Active products: ${summary.active_products}`,
    '',
    '## Public API field exposure',
    `- commercial_state exposed on active rows: ${rows.length - counts.NOT_EXPOSED}/${rows.length}`,
    `- Public product keys: ${publicKeys.map((key) => `\`${key}\``).join(', ')}`,
    '',
    '## Commercial-state counts visible through public API',
    ...Object.entries(counts).map(([state,count]) => `- ${state}: ${count}`),
    '',
    '## Active SKU inventory',
    '',
    '| ID | Product | Public state | Plan | Delivery | Price BDT | Slug |',
    '|---:|---|---|---|---|---:|---|',
    ...rows.map((r) => `| ${r.id} | ${r.name.replace(/\|/g,'\\|')} | ${r.commercial_state} | ${r.plan_type || '—'} | ${r.delivery_type || '—'} | ${Number.isFinite(r.price_bdt) ? r.price_bdt : '—'} | ${r.slug || '—'} |`),
    '',
    '> Catalog-only audit. NOT_EXPOSED means the public API does not reveal the internal D1 commercial_state; it does not infer the D1 value. No customer, order, payment, credential, or admin data is read.',
  ];
  const markdown = lines.join('\n') + '\n';
  writeFileSync('/tmp/aipt-commercial-inventory.md', markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log(markdown);
});
