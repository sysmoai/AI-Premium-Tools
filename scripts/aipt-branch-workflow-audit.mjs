#!/usr/bin/env node
// AIPT branch-aware privileged-workflow audit (#302 / #295).
//
// The main-only isolation guard cannot see workflow files that exist only on
// other branches, yet GitHub runs a branch's own workflow file on `push` to
// that branch, and `workflow_dispatch` can be started from any ref. This audit
// reads every remote branch's .github/workflows as DATA (never executes them)
// and reports files that differ from main and can reach credentials or
// production.
//
// Severity:
//   CRITICAL  foreign business-unit reference + (secret use or a write op)
//   HIGH      secret use + write op, not bound to the protected Production
//             environment (repository-level secrets reach any branch)
//   HIGH      pull_request_target together with any secret
//   WARN      secret use without a write op, or env-bound privileged job
// Exit 1 on CRITICAL or HIGH. Requires a full fetch (actions/checkout
// fetch-depth: 0) so refs/remotes/origin/* exist.
//
// AIPT_RETIRED_REPO_SECRETS=NAME1,NAME2: repository-level secret names that
// have been deleted. An unbound secret+write workflow is downgraded to WARN only
// when EVERY secret it references is in this list; any other secret name keeps
// it HIGH. (Fail-closed: an empty/unset list downgrades nothing.)

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const MAIN = 'origin/main';
const FOREIGN = /\b(save[- ]?on[- ]?sub|saveonsub|aips|ai[- ]premium[- ]shop|aipremiumshop|aitp|ai[- ]team[- ]premium|aiteampremium|softsuper|redwanmart)\b/i;
const SECRET = /\bsecrets\.(?!GITHUB_TOKEN\b)([A-Z0-9_]+)/g;
const WRITES = [
  ['pages-deploy', /wrangler\s+pages\s+deploy/],
  ['worker-deploy', /wrangler\s+(deploy|publish)\b/],
  ['d1-remote', /wrangler\s+d1\s+(execute|migrations\s+apply)[^\n]*--remote/],
  ['r2-write', /wrangler\s+r2\s+object\s+(put|delete)/],
  ['api-mutation', /(--request|-X)\s+(POST|PUT|PATCH|DELETE)\b/],
  ['cache-purge', /purge_cache/],
  ['dns', /dns_records/],
];
const retiredSecrets = new Set(
  (process.env.AIPT_RETIRED_REPO_SECRETS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
);

function workflowBlobs(ref) {
  let out = '';
  try { out = git('ls-tree', '-r', ref, '--', '.github/workflows'); } catch { return new Map(); }
  const map = new Map();
  for (const line of out.split('\n').filter(Boolean)) {
    const [meta, path] = line.split('\t');
    map.set(path, meta.split(' ')[2]);
  }
  return map;
}

function triggers(text) {
  const block = (text.match(/^on:\s*([\s\S]*?)(?=^\S)/m) || [])[1] ?? '';
  const inline = (text.match(/^on:\s*\[?([a-z_, ]+)\]?\s*$/m) || [])[1] ?? '';
  const names = new Set([...block.matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]));
  for (const n of inline.split(',').map((s) => s.trim()).filter(Boolean)) names.add(n);
  return [...names];
}

function analyse(text) {
  const secrets = [...new Set([...text.matchAll(SECRET)].map((m) => m[1]))];
  const writes = WRITES.filter(([, re]) => re.test(text)).map(([name]) => name);
  const foreign = (text.match(FOREIGN) || [])[0] ?? null;
  const envBound = /^\s+environment:\s*['"]?Production['"]?\s*$/m.test(text);
  const on = triggers(text);
  const prt = on.includes('pull_request_target');
  let severity = null;
  if (foreign && (secrets.length || writes.length)) severity = 'CRITICAL';
  else if (prt && secrets.length) severity = 'HIGH';
  else if (secrets.length && writes.length && !envBound) {
    const allRetired = secrets.every((s) => retiredSecrets.has(s));
    severity = allRetired ? 'WARN' : 'HIGH';
  }
  else if (secrets.length) severity = 'WARN';
  return { on, secrets, writes, foreign, envBound, severity };
}

const refs = git('for-each-ref', 'refs/remotes/origin', '--format=%(refname:short) %(objectname)')
  .split('\n').filter(Boolean).map((l) => l.split(' '))
  .filter(([name]) => name !== MAIN && name !== 'origin/HEAD' && name !== 'origin');
if (!refs.length) {
  console.error('No remote branches found. Run with a full fetch (fetch-depth: 0).');
  process.exit(2);
}

const mainBlobs = workflowBlobs(MAIN);
const cache = new Map();
const findings = [];
for (const [ref, sha] of refs) {
  for (const [path, blob] of workflowBlobs(sha)) {
    if (mainBlobs.get(path) === blob) continue; // identical to main: covered by the main guard
    if (!cache.has(blob)) cache.set(blob, analyse(git('cat-file', '-p', blob)));
    const a = cache.get(blob);
    if (a.severity) findings.push({ ref: ref.replace(/^origin\//, ''), sha, path, ...a });
  }
}

const order = { CRITICAL: 0, HIGH: 1, WARN: 2 };
findings.sort((x, y) => order[x.severity] - order[y.severity] || x.ref.localeCompare(y.ref));
const counts = { CRITICAL: 0, HIGH: 0, WARN: 0 };
for (const f of findings) counts[f.severity] += 1;

const lines = [
  '## AIPT branch-aware workflow audit',
  '',
  `Branches scanned (excluding main): ${refs.length}. Retired repository secrets: ${[...retiredSecrets].join(', ') || 'none'}.`,
  `CRITICAL ${counts.CRITICAL} · HIGH ${counts.HIGH} · WARN ${counts.WARN}`,
  '',
];
if (findings.length) {
  lines.push('| Severity | Branch | SHA | Workflow | Triggers | Secrets | Writes | Env-bound | Foreign |', '|---|---|---|---|---|---|---|---|---|');
  for (const f of findings) {
    lines.push(`| ${f.severity} | \`${f.ref}\` | ${f.sha.slice(0, 7)} | ${f.path.split('/').pop()} | ${f.on.join(', ') || '-'} | ${f.secrets.join(', ') || '-'} | ${f.writes.join(', ') || '-'} | ${f.envBound ? 'yes' : 'no'} | ${f.foreign ?? '-'} |`);
  }
} else {
  lines.push('No privileged workflow differences from main were found on any branch.');
}
const report = lines.join('\n') + '\n';
process.stdout.write(report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (process.env.AIPT_BRANCH_AUDIT_REPORT) fs.writeFileSync(process.env.AIPT_BRANCH_AUDIT_REPORT, report);

process.exit(counts.CRITICAL || counts.HIGH ? 1 : 0);
