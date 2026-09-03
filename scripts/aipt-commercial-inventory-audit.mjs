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
const rows = active.map((p) => ({
  id: Number(p?.id),
  name: String(p?.name ?? '').trim(),
  category: String(p?.category_name ?? p?.category ?? '').trim(),
  commercial_state: String(p?.commercial_state ?? '').trim().toUpperCase(),
  plan_type: String(p?.plan_type ?? '').trim(),
  delivery_type: String(p?.delivery_type ?? '').trim(),
  slug: String(p?.slug ?? '').trim(),
  price_bdt: Number(p?.price_bdt),
})).sort((a,b) => a.id - b.id);

const invalid = rows.filter((r) => !Number.isInteger(r.id) || !r.name || !allowedStates.has(r.commercial_state));
if (invalid.length) throw new Error(`Commercial inventory has ${invalid.length} invalid row(s)`);

const counts = Object.fromEntries([...allowedStates].map((state) => [state, rows.filter((r) => r.commercial_state === state).length]));
const summary = {
  captured_at: new Date().toISOString(),
  endpoint,
  total_products: products.length,
  active_products: rows.length,
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
    '## Commercial-state counts',
    ...Object.entries(counts).map(([state,count]) => `- ${state}: ${count}`),
    '',
    '## Active SKU inventory',
    '',
    '| ID | Product | State | Plan | Delivery | Price BDT | Slug |',
    '|---:|---|---|---|---|---:|---|',
    ...rows.map((r) => `| ${r.id} | ${r.name.replace(/\|/g,'\\|')} | ${r.commercial_state} | ${r.plan_type || '—'} | ${r.delivery_type || '—'} | ${Number.isFinite(r.price_bdt) ? r.price_bdt : '—'} | ${r.slug || '—'} |`),
    '',
    '> Catalog-only audit. No customer, order, payment, credential, or admin data is read.',
  ];
  const markdown = lines.join('\n') + '\n';
  writeFileSync('/tmp/aipt-commercial-inventory.md', markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log(markdown);
});
