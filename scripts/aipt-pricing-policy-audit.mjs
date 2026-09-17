#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ssotPath = path.join(repoRoot, "ops", "aipt-pricing-v2.json");
const policyPath = path.join(repoRoot, "functions", "lib", "commercial-policy.ts");
const middlewarePath = path.join(repoRoot, "functions", "_middleware.ts");
const storeSrc = path.join(repoRoot, "artifacts", "aipt-store", "src");

function fail(message) {
  console.error(`[aipt-pricing-policy-audit] ERROR: ${message}`);
  process.exitCode = 1;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const ssot = JSON.parse(fs.readFileSync(ssotPath, "utf8"));
const policy = fs.readFileSync(policyPath, "utf8");
const middleware = fs.readFileSync(middlewarePath, "utf8");

if (!ssot?.revision || !Array.isArray(ssot?.approved_direct_sale)) {
  fail("SSOT is missing revision or approved_direct_sale");
} else {
  if (!policy.includes(`AIPT_COMMERCIAL_REVISION = "${ssot.revision}"`)) {
    fail(`runtime revision does not match SSOT revision ${ssot.revision}`);
  }

  const runtimeRuleCount = (policy.match(/\{ id: "/g) || []).length;
  if (runtimeRuleCount !== ssot.approved_direct_sale.length) {
    fail(`runtime rule count ${runtimeRuleCount} != SSOT count ${ssot.approved_direct_sale.length}`);
  }

  for (const rule of ssot.approved_direct_sale) {
    const marker = `id: "${rule.id}"`;
    const start = policy.indexOf(marker);
    if (start < 0) {
      fail(`runtime rule missing: ${rule.id}`);
      continue;
    }
    const block = policy.slice(start, start + 900);
    if (!block.includes(`priceBdt: ${Number(rule.price_bdt)}`)) {
      fail(`runtime price mismatch for ${rule.id}: expected ${rule.price_bdt}`);
    }
    if (!block.includes(`state: "${rule.commercial_state}"`)) {
      fail(`runtime commercial state mismatch for ${rule.id}: expected ${rule.commercial_state}`);
    }
    const minQty = Number(rule.minimum_quantity ?? 1);
    if (!block.includes(`minQuantity: ${minQty}`)) {
      fail(`runtime minimum quantity mismatch for ${rule.id}: expected ${minQty}`);
    }
  }
}

for (const required of [
  "findCommercialRule",
  "isCommerciallyValidProduct",
  "PRICE_REVIEW_REQUIRED",
  "MINIMUM_SEATS_REQUIRED",
]) {
  if (!middleware.includes(required)) fail(`middleware is missing ${required}`);
}

for (const file of walk(storeSrc)) {
  if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  if (/products_pretty\.json|scripts\/data\/products_pretty|AIPS SPECIAL/i.test(text)) {
    fail(`storefront source imports or embeds legacy/cross-brand catalog data: ${path.relative(repoRoot, file)}`);
  }
}

if (!process.exitCode) {
  console.log(`[aipt-pricing-policy-audit] PASS — ${ssot.approved_direct_sale.length} governed rules match ${ssot.revision}; storefront is isolated from legacy raw catalog.`);
}
