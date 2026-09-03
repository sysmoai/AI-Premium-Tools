#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function resolveBase() {
  const supplied = String(process.env.AIPT_DIFF_BASE || '').trim();
  if (supplied && !/^0+$/.test(supplied)) return supplied;
  try { return git(['rev-parse', 'HEAD^']); } catch { return null; }
}

const head = String(process.env.AIPT_DIFF_HEAD || '').trim() || git(['rev-parse', 'HEAD']);
const base = resolveBase();

if (!base) {
  console.log('AIPT-0010 design-freeze guard: no parent/base commit is available; no redesign diff can be evaluated. PASS.');
  process.exit(0);
}

for (const ref of [base, head]) {
  try { git(['cat-file', '-e', `${ref}^{commit}`]); }
  catch { throw new Error(`AIPT-0010 cannot inspect commit ${ref}. Ensure validation checkout has full history.`); }
}

const raw = git(['diff', '--numstat', base, head]);
const rows = raw ? raw.split('\n').map((line) => {
  const [a, d, ...parts] = line.split('\t');
  const path = parts.join('\t');
  const binary = a === '-' || d === '-';
  return {
    path,
    additions: binary ? 100 : Number(a || 0),
    deletions: binary ? 100 : Number(d || 0),
    binary,
  };
}) : [];

const isTest = (path) => path.includes('/__tests__/') || /\.(test|spec)\.[cm]?[jt]sx?$/.test(path);
const isPublicVisual = (path) =>
  path.startsWith('artifacts/aipt-store/public/') && /\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(path);
const isDesignSensitive = (path) => {
  if (isTest(path)) return false;
  return (
    path === 'artifacts/aipt-store/src/index.css' ||
    path === 'artifacts/aipt-store/src/App.tsx' ||
    path.startsWith('artifacts/aipt-store/src/components/') ||
    path.startsWith('artifacts/aipt-store/src/pages/') ||
    isPublicVisual(path)
  );
};

const designRows = rows.filter((row) => isDesignSensitive(row.path));
const designChurn = designRows.reduce((sum, row) => sum + row.additions + row.deletions, 0);
const indexCssChurn = designRows
  .filter((row) => row.path === 'artifacts/aipt-store/src/index.css')
  .reduce((sum, row) => sum + row.additions + row.deletions, 0);
const visualAssetCount = designRows.filter((row) => isPublicVisual(row.path)).length;

const majorReasons = [];
if (indexCssChurn >= 80) majorReasons.push(`index.css churn ${indexCssChurn} >= 80 lines`);
if (designRows.length >= 5 && designChurn >= 200) majorReasons.push(`${designRows.length} design files with ${designChurn} total changed lines`);
if (designChurn >= 500) majorReasons.push(`design churn ${designChurn} >= 500 lines`);
if (visualAssetCount >= 5) majorReasons.push(`${visualAssetCount} public visual assets changed`);

if (majorReasons.length === 0) {
  console.log(`AIPT-0010 design freeze PASS: ${designRows.length} design-sensitive file(s), ${designChurn} changed line-equivalents; below major-redesign thresholds.`);
  process.exit(0);
}

const changedNames = rows.map((row) => row.path);
const decisionFiles = changedNames.filter((path) =>
  /^docs\/decisions\/design\/AIPT-DESIGN-[A-Za-z0-9._-]+\.md$/.test(path) && !path.endsWith('/TEMPLATE.md')
);

const requiredStrings = [
  'AIPT-0010',
  '## Evidence',
  '## Hypothesis',
  '## Scope',
  '## Acceptance',
  '## Rollback',
  'Decision: PROCEED',
  'Owner: @sysmoai',
];
const allowedEvidence = /Evidence class:\s*(BRAND|CRO|ACCESSIBILITY|SECURITY|COMPLIANCE)/i;

let validDecision = null;
for (const path of decisionFiles) {
  if (!fs.existsSync(path)) continue;
  const text = fs.readFileSync(path, 'utf8');
  const missing = requiredStrings.filter((required) => !text.includes(required));
  if (missing.length === 0 && allowedEvidence.test(text)) {
    validDecision = path;
    break;
  }
}

if (!validDecision) {
  console.error('AIPT-0010 DESIGN FREEZE BLOCKED a major visual redesign.');
  console.error(`Reasons: ${majorReasons.join('; ')}`);
  console.error('A major visual change requires a changed decision record at docs/decisions/design/AIPT-DESIGN-*.md containing:');
  console.error('- AIPT-0010');
  console.error('- Owner: @sysmoai');
  console.error('- Decision: PROCEED');
  console.error('- Evidence class: BRAND, CRO, ACCESSIBILITY, SECURITY, or COMPLIANCE');
  console.error('- sections: ## Evidence, ## Hypothesis, ## Scope, ## Acceptance, ## Rollback');
  console.error('Preference-only redesigns remain frozen until the measurement/CRO gate is satisfied.');
  process.exit(1);
}

console.log(`AIPT-0010 design freeze exception PASS via ${validDecision}.`);
console.log(`Major-change evidence: ${majorReasons.join('; ')}`);
