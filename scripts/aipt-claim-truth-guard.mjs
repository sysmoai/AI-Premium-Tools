#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const registryPath = 'data/aipt-claim-registry.json';
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const today = new Date().toISOString().slice(0, 10);
if (registry?.schema_version !== 1 || !registry.owner || !registry.verified_at || !registry.recheck_at || !Array.isArray(registry.claims) || registry.claims.length < 1) {
  throw new Error('AIPT claim registry is incomplete');
}
if (registry.expiry_behavior !== 'block_publish') throw new Error('AIPT claim registry must fail closed on expiry');
if (registry.recheck_at < today) throw new Error(`AIPT material claim registry expired on ${registry.recheck_at}`);
for (const claim of registry.claims) {
  if (!claim.id || !claim.value || !claim.source) throw new Error(`Invalid claim registry entry: ${JSON.stringify(claim)}`);
  if (!fs.existsSync(claim.source)) throw new Error(`Claim source does not exist: ${claim.source}`);
}

const roots = ['artifacts/aipt-store/index.html', 'artifacts/aipt-store/src', 'artifacts/aipt-store/public/llms.txt'];
const output = execFileSync('git', ['ls-files', '--', ...roots], { encoding: 'utf8' }).trim();
const files = output ? output.split('\n').filter(Boolean) : [];
const forbidden = [
  ['ranking claim', /Bangladesh['’]?s\s+#?1|#1\s+Student\s+AI\s+Store/i],
  ['unverified customer count', /\b1000\+\b/i],
  ['unverified aggregate rating', /\b4\.9\s*\/\s*5\b/i],
  ['unverified savings claim', /15\s*[–-]\s*20%\s+Lower\s+Prices|Avg\s+Savings/i],
  ['unverified one-hour SLA', /Access\s+within\s+1\s+hour|1[- ]Hour\s+Activation|1-hour\s+activation|within\s+1\s+hour/i],
  ['unverified universal warranty', /30-day\s+(?:replacement\s+)?warranty|30-day\s+free\s+replacement/i],
  ['unverified delivery volume', /thousands\s+of\s+(?:successful\s+)?deliveries/i],
  ['unverified provider sourcing', /official\s+channels|never\s+(?:use\s+)?cracked|cracked\s*\/\s*hacked/i],
  ['unverified direct-price basis', /Direct\s+vendor\s*\(after\s+BD\s+VAT\s*\+\s*FX\)|15%\s+VAT\s+plus\s+FX/i],
  ['unverified superlative', /most\s+affordable|lowest\s+prices/i],
  ['unsupported payment methods', /Rocket\s*,\s*Upay|Rocket\s*,\s*Upay\s*,\s*Bank/i],
  ['unverified geographic claim', /all\s+64\s+districts/i],
  ['unverified automated renewal reminder', /renewal\s+reminder[^.\n]*3\s+days/i],
  ['unverified dedicated account manager', /dedicated\s+account\s+manager/i],
  ['unverified affiliate program', /affiliate\s+program/i],
];

const violations = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    for (const [label, regex] of forbidden) {
      if (regex.test(lines[i])) violations.push(`${file}:${i + 1}: ${label}`);
    }
  }
}

if (violations.length) {
  console.error('AIPT CLAIM TRUTH GUARD FAILED.');
  for (const violation of violations.slice(0, 100)) console.error(`- ${violation}`);
  if (violations.length > 100) console.error(`- ... ${violations.length - 100} more`);
  console.error('Replace unsupported marketing assertions with dynamic or evidence-backed wording before publish.');
  process.exit(1);
}

console.log(`AIPT claim truth PASS: ${registry.claims.length} material claim types current through ${registry.recheck_at}; scanned ${files.length} public source file(s).`);
