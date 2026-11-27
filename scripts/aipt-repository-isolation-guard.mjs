#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const expectedRepo = 'sysmoai/AI-Premium-Tools';
const repository = process.env.GITHUB_REPOSITORY || expectedRepo;
if (repository !== expectedRepo) {
  throw new Error(`AIPT isolation guard refuses unexpected repository: ${repository}`);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const pathRoots = [
  '.github/workflows',
  'functions',
  'artifacts/aipt-store/src',
  'd1',
  'server',
  'packages',
];

let tracked = [];
try {
  const output = git(['ls-files', '--', ...pathRoots]);
  tracked = output ? output.split('\n').filter(Boolean) : [];
} catch {
  tracked = [];
}

const foreignPatterns = [
  { label: 'SaveOnSub', regex: /saveonsub(?:-store)?|saveonsub\.com/i },
  { label: 'AIPS / AI Premium Shop', regex: /\bAIPS\b|AI[ -]?Premium[ -]?Shop|aipremiumshop\.com/i },
  { label: 'AITP / AI Team Premium', regex: /\bAITP\b|AI[ -]?Team[ -]?Premium|aiteampremium\.com/i },
];

const scanExtensions = new Set([
  '.yml', '.yaml', '.json', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.sql', '.toml', '.html', '.css', '.scss', '.sh', '.ps1', '.py', '.txt',
]);

function extension(path) {
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  return dot > slash ? path.slice(dot).toLowerCase() : '';
}

const violations = [];
for (const path of tracked) {
  for (const pattern of foreignPatterns) {
    if (pattern.regex.test(path)) {
      violations.push(`${path}: filename/path references foreign unit ${pattern.label}`);
    }
  }

  if (!scanExtensions.has(extension(path))) continue;
  let text;
  try {
    text = fs.readFileSync(path, 'utf8');
  } catch {
    continue;
  }

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    for (const pattern of foreignPatterns) {
      if (pattern.regex.test(line)) {
        violations.push(`${path}:${index + 1}: runtime/control content references foreign unit ${pattern.label}`);
      }
    }
  }
}

if (violations.length) {
  console.error('AIPT REPOSITORY ISOLATION GUARD FAILED.');
  console.error('AIPT runtime/control code must not deploy, operate, brand, price, or authenticate another portfolio business unit.');
  for (const violation of violations.slice(0, 100)) console.error(`- ${violation}`);
  if (violations.length > 100) console.error(`- ... ${violations.length - 100} additional violation(s)`);
  console.error('Move foreign-unit automation/data/assets to that unit\'s canonical repository and credential boundary.');
  process.exit(1);
}

console.log(`AIPT repository isolation PASS: scanned ${tracked.length} tracked runtime/control file(s); no disallowed cross-unit references detected.`);
