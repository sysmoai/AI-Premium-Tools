#!/usr/bin/env node

const mode = process.argv.includes('--apply') ? 'apply' : 'check';
const expectedRepo = 'sysmoai/AI-Premium-Tools';
const repository = process.env.GITHUB_REPOSITORY || expectedRepo;

const milestone = {
  title: 'AIPT 90-Day Execution - Sep 3-Dec 5, 2026',
  description:
    'Canonical 90-day execution milestone for AIPT. Source: docs/AIPT_MASTER_SYSTEM.md and the AIPT Master Development, Growth & Operations System v1.0.',
  due_on: '2026-12-05T17:59:59Z',
};

const labels = [
  ['aipt-wave-0', '0E8A16', 'AIPT 90-day roadmap Wave 0'],
  ['aipt-wave-1', '5319E7', 'AIPT 90-day roadmap Wave 1'],
  ['aipt-wave-2', '0052CC', 'AIPT 90-day roadmap Wave 2'],
  ['aipt-wave-3', '1D76DB', 'AIPT 90-day roadmap Wave 3'],
  ['aipt-wave-4', 'FBCA04', 'AIPT 90-day roadmap Wave 4'],
  ['aipt-wave-5', 'D4C5F9', 'AIPT 90-day roadmap Wave 5'],
  ['aipt-wave-6', 'B60205', 'AIPT 90-day roadmap Wave 6'],
  ['aipt-wave-7', '0E8A16', 'AIPT 90-day roadmap Wave 7'],
  ['aipt-wave-8', 'D93F0B', 'AIPT 90-day roadmap Wave 8'],
  ['aipt-wave-9', '006B75', 'AIPT 90-day roadmap Wave 9'],
  ['roadmap', '1D76DB', 'AIPT roadmap and execution governance'],
  ['blocked', 'B60205', 'Blocked by external dependency or unavailable authorized control plane'],
  ['priority-p0', 'B60205', 'Live correctness or critical production issue'],
  ['priority-p1', 'D93F0B', 'High-impact architecture or growth issue'],
  ['governance', '5319E7', 'Governance, release, repository, or operating-system work'],
  ['brand-truth', '7057FF', 'Brand, claims, commercial eligibility, or evidence truth'],
  ['seo', '0E8A16', 'Technical SEO, indexing, metadata, schema, or search work'],
  ['measurement', '1D76DB', 'Analytics, attribution, Search Console, or reporting work'],
  ['catalog-media', 'FBCA04', 'Catalog quality, product content, images, video, or R2 media'],
  ['content', 'C5DEF5', 'Editorial, guides, comparisons, resources, or video content'],
  ['commerce', 'B60205', 'Payments, orders, fulfillment, inventory, or reconciliation'],
  ['lifecycle', '0E8A16', 'CRM, newsletter, messaging, renewals, reviews, or customer hub'],
  ['security', 'D93F0B', 'Security, recovery, privacy, accessibility, or performance'],
  ['automation', '006B75', 'Control Center, agents, watchdogs, or automation'],
].map(([name, color, description]) => ({ name, color, description }));

const issuePlan = [
  [20, ['roadmap', 'aipt-wave-2', 'priority-p1', 'seo']],
  [284, ['roadmap', 'aipt-wave-0', 'governance']],
  [285, ['roadmap', 'aipt-wave-1', 'brand-truth']],
  [286, ['roadmap', 'aipt-wave-2', 'priority-p1', 'seo']],
  [287, ['roadmap', 'aipt-wave-3', 'measurement']],
  [288, ['roadmap', 'aipt-wave-4', 'catalog-media']],
  [289, ['roadmap', 'aipt-wave-5', 'content']],
  [290, ['roadmap', 'aipt-wave-6', 'commerce']],
  [291, ['roadmap', 'aipt-wave-7', 'lifecycle']],
  [292, ['roadmap', 'aipt-wave-8', 'security']],
  [293, ['roadmap', 'aipt-wave-9', 'automation']],
  [294, ['roadmap', 'aipt-wave-0', 'blocked', 'measurement']],
  [295, ['roadmap', 'aipt-wave-0', 'blocked', 'governance', 'security']],
].map(([number, wantedLabels]) => ({ number, wantedLabels }));

function assertPlan() {
  if (repository !== expectedRepo) {
    throw new Error(`Refusing to operate on unexpected repository: ${repository}`);
  }
  const labelNames = new Set(labels.map((label) => label.name));
  if (labelNames.size !== labels.length) throw new Error('Duplicate label definition detected');
  const issueNumbers = new Set(issuePlan.map((issue) => issue.number));
  if (issueNumbers.size !== issuePlan.length) throw new Error('Duplicate issue mapping detected');
  for (const issue of issuePlan) {
    for (const name of issue.wantedLabels) {
      if (!labelNames.has(name)) throw new Error(`Issue #${issue.number} references undefined label ${name}`);
    }
  }
  if (!/^2026-12-05T/.test(milestone.due_on)) throw new Error('Unexpected milestone due date');
}

assertPlan();

if (mode === 'check') {
  console.log(`Roadmap governance plan valid: ${labels.length} labels, ${issuePlan.length} issues, 1 milestone.`);
  process.exit(0);
}

const token = process.env.GH_TOKEN;
if (!token) throw new Error('GH_TOKEN is required in --apply mode');
if (process.env.GITHUB_REF !== 'refs/heads/main') {
  throw new Error(`Refusing roadmap mutation from non-main ref: ${process.env.GITHUB_REF || 'unknown'}`);
}

const [owner, repo] = expectedRepo.split('/');
const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'AIPT-Roadmap-Governance/1.0',
};

async function api(path, { method = 'GET', body, allow404 = false } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (allow404 && response.status === 404) return null;
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { message: text.slice(0, 500) }; }
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with HTTP ${response.status}: ${payload?.message || 'GitHub API error'}`);
  }
  return payload;
}

async function ensureLabel(label) {
  const encoded = encodeURIComponent(label.name);
  const current = await api(`/labels/${encoded}`, { allow404: true });
  if (!current) {
    await api('/labels', { method: 'POST', body: label });
    console.log(`Created label: ${label.name}`);
    return;
  }
  if (String(current.color).toUpperCase() !== label.color || current.description !== label.description) {
    await api(`/labels/${encoded}`, {
      method: 'PATCH',
      body: { new_name: label.name, color: label.color, description: label.description },
    });
    console.log(`Updated label: ${label.name}`);
  } else {
    console.log(`Label already correct: ${label.name}`);
  }
}

async function ensureMilestone() {
  const all = await api('/milestones?state=all&per_page=100');
  let current = all.find((candidate) => candidate.title === milestone.title);
  if (!current) {
    current = await api('/milestones', { method: 'POST', body: { ...milestone, state: 'open' } });
    console.log(`Created milestone #${current.number}: ${milestone.title}`);
    return current;
  }
  const desiredDue = new Date(milestone.due_on).toISOString();
  const currentDue = current.due_on ? new Date(current.due_on).toISOString() : null;
  if (current.description !== milestone.description || currentDue !== desiredDue || current.state !== 'open') {
    current = await api(`/milestones/${current.number}`, {
      method: 'PATCH',
      body: { ...milestone, state: 'open' },
    });
    console.log(`Updated milestone #${current.number}: ${milestone.title}`);
  } else {
    console.log(`Milestone already correct: #${current.number}`);
  }
  return current;
}

async function attachIssue(issue, milestoneNumber) {
  const current = await api(`/issues/${issue.number}`);
  if (current.pull_request) throw new Error(`#${issue.number} is a pull request, not an issue`);
  const existingLabels = (current.labels || []).map((label) => typeof label === 'string' ? label : label.name);
  const mergedLabels = [...new Set([...existingLabels, ...issue.wantedLabels])].sort();
  const existingAssignees = (current.assignees || []).map((assignee) => assignee.login);
  const mergedAssignees = [...new Set([...existingAssignees, 'sysmoai'])];
  const currentMilestone = current.milestone?.number ?? null;
  const labelsEqual = JSON.stringify([...existingLabels].sort()) === JSON.stringify(mergedLabels);
  const ownerPresent = mergedAssignees.includes('sysmoai') && existingAssignees.includes('sysmoai');
  if (labelsEqual && ownerPresent && currentMilestone === milestoneNumber) {
    console.log(`Issue #${issue.number} already attached correctly`);
    return;
  }
  await api(`/issues/${issue.number}`, {
    method: 'PATCH',
    body: {
      labels: mergedLabels,
      assignees: mergedAssignees,
      milestone: milestoneNumber,
    },
  });
  console.log(`Attached issue #${issue.number} to milestone #${milestoneNumber} with ${mergedLabels.length} label(s)`);
}

for (const label of labels) await ensureLabel(label);
const ensuredMilestone = await ensureMilestone();
for (const issue of issuePlan) await attachIssue(issue, ensuredMilestone.number);

console.log(`AIPT roadmap governance PASS: milestone #${ensuredMilestone.number}, ${labels.length} labels, ${issuePlan.length} issues.`);
