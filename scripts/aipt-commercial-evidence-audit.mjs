#!/usr/bin/env node
import fs from 'node:fs';

const inventoryPath = process.argv[2] || '/tmp/aipt-commercial-internal.json';
const registryPath = process.argv[3] || 'data/aipt-commercial-evidence.json';
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

if (inventory?.status !== 'ok' || inventory?.catalog_only !== true || !Array.isArray(inventory.rows)) {
  throw new Error('Authenticated commercial inventory is invalid');
}
if (registry?.schema_version !== 1 || !Array.isArray(registry.groups)) throw new Error('Commercial evidence registry schema is invalid');

const allowedStates = new Set(['CUSTOMER_OWNED','AUTHORIZED_SEAT','HOLD','PROHIBITED']);
const today = new Date().toISOString().slice(0, 10);
if (!registry.owner || !registry.reviewed_at || !registry.recheck_at || !registry.default_aipt_evidence) throw new Error('Registry governance metadata is incomplete');
if (registry.recheck_at < today) throw new Error(`Commercial evidence registry expired on ${registry.recheck_at}`);

const mapping = new Map();
for (const group of registry.groups) {
  if (!group.provider || !Array.isArray(group.ids) || !group.ids.length || !allowedStates.has(group.state) || !group.source || !group.evidence) {
    throw new Error(`Invalid registry group: ${JSON.stringify(group)}`);
  }
  for (const rawId of group.ids) {
    const id = Number(rawId);
    if (!Number.isInteger(id)) throw new Error(`Invalid product id in ${group.provider}`);
    if (mapping.has(id)) throw new Error(`Product ${id} appears in multiple evidence groups`);
    mapping.set(id, group);
  }
}

const activeIds = new Set(inventory.rows.map((row) => Number(row.id)));
const missing = [...activeIds].filter((id) => !mapping.has(id));
const extra = [...mapping.keys()].filter((id) => !activeIds.has(id));
if (missing.length) throw new Error(`Active product(s) missing commercial evidence: ${missing.join(', ')}`);
if (extra.length) throw new Error(`Commercial registry references non-active/unknown product(s): ${extra.join(', ')}`);

const stateMismatches = [];
const rows = inventory.rows.map((row) => {
  const group = mapping.get(Number(row.id));
  if (row.commercial_state !== group.state) stateMismatches.push(`${row.id}:${row.commercial_state}->${group.state}`);
  return {
    id: Number(row.id),
    name: String(row.name),
    provider: group.provider,
    state: group.state,
    source: group.source,
    evidence: group.evidence,
    owner: registry.owner,
    reviewed_at: registry.reviewed_at,
    recheck_at: registry.recheck_at,
    completeness_score: Number(row?.completeness?.score ?? 0),
    missing_fields: Array.isArray(row?.completeness?.missing) ? row.completeness.missing : [],
    media_count: Number(row?.media_count ?? 0),
  };
});
if (stateMismatches.length) throw new Error(`D1/registry commercial-state mismatch: ${stateMismatches.join(', ')}`);

const states = Object.fromEntries([...allowedStates].map((state) => [state, rows.filter((r) => r.state === state).length]));
const incomplete = rows.filter((r) => r.completeness_score < 100);
const output = {
  status: 'ok',
  captured_at: inventory.captured_at,
  registry_reviewed_at: registry.reviewed_at,
  registry_recheck_at: registry.recheck_at,
  active_products: rows.length,
  state_counts: states,
  complete_products: rows.length - incomplete.length,
  incomplete_products: incomplete.length,
  rows,
};
fs.writeFileSync('/tmp/aipt-commercial-evidence-audit.json', JSON.stringify(output, null, 2));

const lines = [
  '# AIPT commercial evidence + completeness audit',
  '',
  `Captured: ${output.captured_at}`,
  `Registry reviewed: ${output.registry_reviewed_at}`,
  `Registry recheck: ${output.registry_recheck_at}`,
  `Active products: ${output.active_products}`,
  '',
  '## Commercial states',
  ...Object.entries(states).map(([state,count]) => `- ${state}: ${count}`),
  '',
  `Complete catalog records: ${output.complete_products}/${output.active_products}`,
  `Incomplete catalog records: ${output.incomplete_products}/${output.active_products}`,
  '',
  '| ID | Product | Provider | State | Completeness | Missing | Recheck |',
  '|---:|---|---|---|---:|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.name.replace(/\|/g,'\\|')} | ${r.provider.replace(/\|/g,'\\|')} | ${r.state} | ${r.completeness_score}% | ${r.missing_fields.join(', ') || '—'} | ${r.recheck_at} |`),
  '',
  '> Positive commercial permission is never inferred. Missing or unverified AIPT-specific evidence remains HOLD. Completeness is a catalog-quality score, not permission to sell.',
];
const markdown = lines.join('\n') + '\n';
fs.writeFileSync('/tmp/aipt-commercial-evidence-audit.md', markdown);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
console.log(markdown);
