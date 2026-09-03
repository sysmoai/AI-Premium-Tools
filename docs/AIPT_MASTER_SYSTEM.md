# AIPT Master System — Canonical Operating SSOT

**System:** AI Premium Tools (AIPT)  
**Canonical domain:** `https://aipremium.tools`  
**Canonical repository:** `sysmoai/AI-Premium-Tools`  
**Initial SSOT date:** 2026-09-03 (Asia/Dhaka)  
**Authority:** This file is the canonical operational coordination document for AIPT. It is not a substitute for runtime evidence, source code, provider terms, or protected secrets.

---

## 1. Purpose

This document gives future maintainers, agents, developers, operators, SEO/content workers, and reviewers one authoritative starting point for AIPT.

Its job is to answer five questions before work begins:

1. What is AIPT and what must remain isolated from other business units?
2. What is the verified production architecture and safety model?
3. What facts are authoritative, and what facts are merely dated snapshots?
4. What roadmap item is currently active and what gates block later work?
5. How must changes be built, reviewed, deployed, verified, rolled back, and documented?

This file should remain compact enough to operate from, while linking to deeper implementation/runbook evidence.

---

## 2. Authority hierarchy

When sources disagree, use this order of authority:

1. **Live production evidence and provider control-plane evidence** — successful health checks, Cloudflare bindings, production API responses, Google Search Console authenticated data, GitHub workflow results, and other directly verified runtime facts.
2. **Source-controlled configuration and implementation** — `wrangler.toml`, `.github/workflows/`, `functions/`, D1 migrations, application code, package manifests, and tests.
3. **This file: `docs/AIPT_MASTER_SYSTEM.md`** — coordination SSOT, operating policy, roadmap/gate state, and evidence map.
4. **Current focused runbooks/audits** — `docs/operations/*`, `docs/audit/*`, and task-specific PR evidence.
5. **Dated snapshots** — for example `docs/AIPT_SYSTEM_BASELINE.md`. Dated snapshots are historical evidence, not automatically current truth.
6. **Chat history, memory, screenshots, public snippets, or assumptions** — useful leads, never stronger than verified evidence.

If this file conflicts with verified production/code truth, production/code truth wins and this file must be corrected in the same task or immediately afterward.

Never store passwords, private keys, recovery secrets, payment credentials, customer data, or private exports in this public repository or in this document.

---

## 3. Business-unit isolation

AIPT is a distinct business unit.

Do **not** mix AIPT assets, claims, pricing, customer data, credentials, content, policies, or operational state with:

- AIPS / AI Premium Shop
- AITP / AI Team Premium
- SaveOnSub
- SYSmoAI
- EMON RPM
- EMONPRO or any other Emon business/project

AIPT changes must be based only on AIPT-specific evidence unless another source is explicitly and lawfully reused.

Do not invent a new AIPT logo, identity, authorization status, reseller relationship, customer statistic, market-leading claim, or provider permission without evidence.

---

## 4. Mission and operating objective

AIPT should become a high-trust Bangladesh-focused platform for legitimate AI-tool access, procurement/activation support, education, comparison, price intelligence, and related customer service.

The growth objective is **50,000+ qualified monthly organic visitors**, but this is a target, not a promise or current fact.

Optimization priorities, in order:

1. production safety and data integrity;
2. truthful provider/commercial eligibility;
3. customer trust and successful fulfillment;
4. measurement quality;
5. technical SEO/indexing correctness;
6. useful Bangladesh-focused content and product media;
7. conversion, retention, revenue, and margin improvement;
8. automation only where it remains observable, reversible, and safe.

Do not trade trust, policy compliance, data safety, or recoverability for short-term growth.

---

## 5. Non-negotiable change rules

All meaningful changes must be:

- evidence-led;
- minimal in scope;
- reversible;
- branch/PR based;
- validated before merge;
- independently verified after production deployment when runtime behavior changes;
- documented when architecture, operating state, or roadmap gates materially change.

Do not perform or silently authorize:

- destructive D1 operations;
- irreversible R2 deletion;
- Git history rewrite;
- domain ownership transfer;
- broad secret exposure;
- unreviewed billing changes;
- commercial eligibility changes based on guesswork;
- URL migrations without redirect/canonical/indexing plans;
- large redesigns before measurement/CRO evidence;
- unsupported SEO claims or fabricated Search Console metrics.

If a task cannot be verified, mark it **BLOCKED**, **PARTIAL**, or **PENDING VERIFICATION**. Never label it PASS merely because code or documentation was written.

---

## 6. Canonical production architecture

### Public production

- Canonical host: `https://aipremium.tools`
- Canonical runtime: Cloudflare Pages
- Pages project: `ai-premium-tools`
- Production server logic: Cloudflare Pages Functions
- Production database: Cloudflare D1
- D1 binding: `DB`
- D1 database name: `aipt-db`
- D1 database ID: `9c19dfdb-aead-4bed-b6ff-f6bf379bc296`
- Production media: Cloudflare R2
- R2 binding: `MEDIA`
- R2 bucket: `aipt-media`
- Current production migration target as of this SSOT creation: `0002_catalog_media_foundation.sql`

`wrangler.toml` is the source-controlled binding reference. Control-plane/runtime verification is stronger than this document when checking whether a binding is actually attached to production.

### Frontend

Current primary frontend stack includes:

- React
- TypeScript
- Vite
- Tailwind CSS 4
- shadcn/Radix primitives
- TanStack React Query
- React Hook Form
- Zod
- Wouter
- Framer Motion
- Lucide
- Recharts
- Sonner
- Vitest / Testing Library / jsdom
- pnpm monorepo tooling

### Local backend

Local development is materially different from production:

- Express 5
- Drizzle
- PostgreSQL

Production uses Pages Functions + D1/raw SQL.

This dual-backend architecture is a known drift risk. A route/business-rule change must be checked against both implementations where both remain in use.

---

## 7. Canonical application routes

Current public/store route patterns include:

- `/`
- `/products`
- `/products/:id`
- `/cart`
- `/checkout`
- `/order-success/:id`
- `/track-order`
- `/faq`
- `/about`
- `/contact`
- `/shipping-policy`
- `/refund-policy`
- `/privacy-policy`
- `/terms`

Current admin route patterns include:

- `/admin`
- `/admin/orders`
- `/admin/products`
- `/admin/products/:id/media`
- `/admin/media`
- `/admin/customers`

Treat source code (`artifacts/aipt-store/src/App.tsx`) as authoritative if routes change.

The public Admin navigation exposure is a known future security/UX cleanup area; do not weaken server-side authorization merely because a route is hidden from navigation.

---

## 8. D1 schema and catalog foundation

The production data model includes the original commerce tables and the catalog/media foundation introduced by migration `0002_catalog_media_foundation.sql`.

Important catalog/media concepts include:

- `media_assets`
- `product_families`
- `product_media`
- stable `slug`
- `sku`
- `family`
- `short_description`
- `plan_type`
- `delivery_type`
- `commercial_state`
- `sort_order`
- `seo_title`
- `seo_description`
- `seo_index`
- `updated_at`

Commercial-state values include:

- `CUSTOMER_OWNED`
- `AUTHORIZED_SEAT`
- `HOLD`
- `PROHIBITED`

Media roles include logo/primary/gallery/thumbnail/hero/video/poster/documentation roles.

Normal deploys deliberately verify the expected migration set and production binding. New remote D1 migrations must go through a guarded migration process; they must not be silently applied simply because a deployment occurs.

---

## 9. Commerce truth and provider eligibility

AIPT must not assume that every historical SKU or access model is allowed to be sold.

Use SKU/provider-level eligibility, not blanket assumptions.

Preferred states:

- **CUSTOMER_OWNED** — customer uses their own provider account and AIPT lawfully assists with payment/procurement/activation.
- **AUTHORIZED_SEAT** — a legitimate team/business/reseller/seat structure is verified for that provider/SKU.
- **HOLD** — authorization or fulfillment model is unclear; do not actively sell until verified.
- **PROHIBITED** — the specific offer conflicts with provider rules, legal obligations, or approved AIPT policy and must not be sold.

Official gift/redemption programs, documented reseller channels, approved team/business seats, and customer-owned procurement can be valid paths when provider evidence supports them.

Never claim AIPT is an authorized reseller/partner for a provider without evidence.

Homepage/social/product claims such as “#1”, “1000+ students”, rating scores, fulfillment-time guarantees, savings percentages, or customer counts must be evidence-audited before being repeated or expanded.

---

## 10. Checkout and payment baseline

Current customer checkout is a guest flow with customer information and manual payment/reference handling.

Server-side logic must remain authoritative for prices and order calculations; do not trust client-submitted price values.

Any future payment-gateway implementation should include:

- server-side create/execute/capture/verify flow;
- unique transaction identifiers;
- idempotency;
- webhook verification;
- explicit payment/order state machines;
- reconciliation;
- safe fallback while the new path stabilizes;
- invoices/entitlements/renewals only after core transaction integrity is proven.

Do not remove the current working fallback until the replacement is production-verified.

---

## 11. Authentication and security boundaries

Current production admin access uses server-side authentication mechanisms with protected configuration such as `ADMIN_PASSWORD` and `SESSION_SECRET`.

Rules:

- secrets never belong in Git;
- missing critical auth configuration must fail closed;
- client-side route hiding is not authorization;
- token values must not appear in logs, issues, documentation, screenshots, or chat handoffs;
- historical secret exposure must not be assumed remediated unless rotation is directly verified;
- repository visibility/branch protection/secrets governance is owned by AIPT-0008.

Future hardening priorities include Cloudflare Access/app auth/2FA, rate limiting, Turnstile where appropriate, security headers/CSP, stronger audit logs, and reduced public admin discoverability.

---

## 12. R2 media and recovery architecture

### Normal media

R2 bucket `aipt-media` stores production media. Current media support includes common web image/video types with application-enforced size/type controls.

Normal application media is served through first-party `/media/...` routing.

### Protected recovery namespace

Encrypted backup objects live under:

`_aipt-backups/`

The public media route must return HTTP 404 for this namespace.

Backup payloads use envelope encryption:

- fresh AES-256-GCM payload key;
- random IV;
- RSA-OAEP SHA-256 wraps the AES key;
- only the public recovery key is allowed in repository code;
- the private recovery key is held outside GitHub/Cloudflare in the owner's private recovery vault.

### Off-provider recovery

AIPT-0004 established an independent recovery layer:

- daily/post-deploy encrypted backup flow;
- GitHub OIDC short-lived identity;
- no dedicated long-lived Cloudflare backup token;
- encrypted backup export only;
- SHA-256 verification metadata;
- GitHub encrypted artifact retention window of 7 days;
- durable encrypted baseline copied to private Google Drive recovery storage.

Never publish or reproduce the recovery private key.

Detailed recovery documentation:

- `docs/operations/AIPT-0003-DATA-BACKUP-RECOVERY.md`
- `docs/operations/AIPT-0004-R2-INVENTORY-RETENTION-RESILIENCE.md`

---

## 13. CI/CD and production verification

Canonical deploy workflow:

`.github/workflows/deploy.yml`

Expected validation/deploy sequence includes:

1. checkout;
2. pnpm/Node setup;
3. dependency install;
4. workspace typecheck;
5. storefront tests;
6. local D1 migration validation;
7. storefront build;
8. production migration-target guard;
9. Cloudflare Pages production D1-binding verification;
10. Cloudflare Pages deployment;
11. immutable deployment health verification;
12. product/API/schema verification on immutable deployment;
13. bounded canonical-domain propagation verification;
14. production health/schema verification.

Pull requests validate without production deployment. Pushes/merges to `main` can deploy production.

Do not merge a docs-only PR solely to create the appearance of completion when triggering a production deployment would add no operational value. However, an SSOT that is intended to become canonical must ultimately land on `main` through the normal reviewed process.

---

## 14. Continuous monitoring

Production monitoring currently checks important customer routes, API health, catalog availability, schema state, admin authorization gates, robots/sitemap behavior, and related invariants.

Core workflows include:

- `Continuous AIPT Production Monitor`
- `AIPT Commerce and Data Integrity Watch`
- `Deep AIPT SEO and Content Audit`
- `AIPT Production Backup`
- automation supervisor workflows

A successful deploy is not sufficient by itself. Post-deploy monitors must remain green before a runtime-changing roadmap item is marked complete.

---

## 15. SEO and organic-growth state

Canonical SEO backlog source:

GitHub issue `#20` — `[audit] AIPT organic growth and SEO backlog`

Latest verified automated signals at SSOT creation:

- live products: **71**
- sitemap URLs: **89**
- P0 findings: **0**
- P1 findings: **4**
- P2 findings: **3**

Current high-impact backlog:

### P1

- missing product routes still produce a soft-404 HTTP pattern (`/products/999999999` returns 200 at the page layer);
- 71/71 products missing explicit `seo_description`;
- 71/71 products missing explicit `seo_title`;
- 71/71 products missing stable `slug`.

### P2

- 71/71 products missing `short_description`;
- 71/71 products have zero `product_media` relationships;
- 2/71 product descriptions are under 80 characters.

Do not infer that these counts remain current forever. Issue #20 is automation-maintained and is stronger for current counts.

### Intended future URL direction

Canonical product URLs should ultimately move toward stable slug-based URLs, with exact redirect mapping from legacy numeric URLs. Do not launch that migration until mapping, canonical behavior, HTTP status behavior, sitemap updates, and rollback are prepared.

### Edge/server SEO direction

AIPT should improve server/edge-visible SEO without an unnecessary framework rewrite. Pages Functions/HTMLRewriter or another reversible edge strategy may be preferable to rebuilding the application.

Target Core Web Vitals reference thresholds for future optimization:

- LCP <= 2.5 s
- INP < 200 ms
- CLS < 0.1

Use real Search Console/CrUX field data where available; lab data is diagnostic, not a substitute for field measurement.

---

## 16. Google Search Console measurement state

AIPT-0005 is **PARTIAL / BLOCKED on authenticated GSC report export**.

Verified Google Search Console evidence from transactional messages:

- `aipremium.tools` is a verified **Domain property**;
- Google began collecting Search impressions for the property on **2026-08-06**;
- Google reported a milestone of **40 Google Search clicks in the preceding 28 days as of 2026-08-31**;
- GSC has reported indexing conditions including 404, soft 404, robots blocking, noindex exclusion, alternate canonical, duplicate-without-user-selected-canonical, redirect pages, and Google selecting a different canonical;
- a Search Console message on 2026-08-21 reported **49 active products** were not on the Search Shopping tab.

Frozen requested baseline windows:

- 28 complete days: `2026-08-06` through `2026-09-02`
- requested 90 days: `2026-06-05` through `2026-09-02`, noting Search Console data collection started 2026-08-06

Still required for AIPT-0005 PASS:

- exact clicks/impressions/CTR/position totals;
- Queries export;
- Pages export;
- indexed/not-indexed totals and reason counts;
- Mobile/Desktop Core Web Vitals report values;
- complete sitemap submission/read state.

Public search, sitemap counts, third-party SEO tools, or PageSpeed lab runs must not be inserted into GSC metric fields as substitutes.

Current evidence PR: `#278`.

---

## 17. Brand baseline

Current working AIPT identity:

- master brand: **AIPT**
- working tagline: **Affordable AI Subscriptions in Bangladesh**
- primary visual direction: deep purple (`#7C3AED`) + blue
- headings: Outfit
- body: Plus Jakarta Sans
- tone: student-friendly, trustworthy, conversion-focused

A favicon/stylized mark exists, but no authoritative full AIPT wordmark asset has been established in the verified repository evidence used for this SSOT.

Do not invent a replacement logo or use another business unit's branding.

Later brand work must canonicalize actual approved assets and document them.

---

## 18. Content and media growth policy

Organic growth should come from real usefulness, not thin SEO pages.

Preferred content directions:

- Bangladesh-specific tool guides;
- pricing/payment/activation explainers;
- comparisons based on current provider facts;
- product walkthroughs;
- screenshots and original media where permitted;
- Bangla + English support/education;
- transparent eligibility/availability explanations;
- useful FAQs and troubleshooting;
- evidence-based price intelligence.

Do not publish unsupported provider claims, fabricated reviews, invented experience, scraped low-value pages, or large AI-generated keyword farms.

Where editorial author attribution is displayed on site resources, current audit guidance uses **AIPT Admin**.

---

## 19. Analytics and experimentation policy

Do not claim conversion or SEO wins without a measurable baseline.

Measurement foundation still needs stronger first-party analytics/funnel verification (for example GA4/GTM/Clarity or equivalent verified implementation).

Before major CRO/redesign experiments, establish or verify:

- page/session measurement;
- product-view events;
- add-to-cart events;
- checkout-start events;
- order-success events;
- acquisition/source attribution where lawful;
- SEO landing-page performance;
- repeat customer and refund/failure metrics;
- support load/SLA;
- product margin/availability.

AIPT-0010 freezes major redesign until analytics/CRO evidence exists.

---

## 20. Rollback model

Rollback must identify which state changed.

### Source/application rollback

Use a known-good Git reference/branch. A permanent rollback reference from AIPT-0002 points to the verified baseline production commit:

`28da818cd1682cd617d4420bb98925a502dbe759`

Rollback branch:

`rollback/aipt-production-baseline-2026-09-03`

### D1 rollback/recovery

Source-code rollback does not automatically undo database writes or migrations. Use the documented encrypted logical backup/recovery process and restore to staging/new resources first.

### R2 rollback/recovery

Do not delete recovery objects during incident response. Restore/reconcile media using encrypted manifests and checksums.

### Configuration rollback

Pages bindings, environment variables, domain/DNS state, Cloudflare settings, GitHub configuration, and external provider state are separate from Git source. Record and verify them independently.

Never assume `git revert` restores the entire production system.

---

## 21. Current roadmap and gate state

The roadmap is sequential. Do not skip protection/measurement gates simply because a later task looks more valuable.

### Wave 0 — protection and truth foundation

| ID | Task | Current state |
|---|---|---|
| AIPT-0001 | Capture production baseline | **COMPLETE** — PR #274 |
| AIPT-0002 | Git release/protected rollback reference | **COMPLETE WITH TOOL LIMITATION** — rollback branch created; desired annotated tag/release was unavailable through connector; PR #275 |
| AIPT-0003 | D1 backup/recovery baseline | **COMPLETE / PRODUCTION VERIFIED** — PR #276 merged |
| AIPT-0004 | R2 inventory + retention/off-provider recovery | **COMPLETE / PRODUCTION VERIFIED** — merged to `main` |
| AIPT-0005 | GSC 90-day/28-day queries/pages/CWV baseline | **PARTIAL / BLOCKED** — authenticated report export still required; PR #278 |
| AIPT-0006 | Correct stale `PRODUCTION_SETUP.md` | **PASS / PR OPEN** — PR #279; docs correction prepared, not merged at SSOT creation |
| AIPT-0007 | Create canonical `docs/AIPT_MASTER_SYSTEM.md` | **IN PROGRESS at initial creation** |
| AIPT-0008 | Verify/fix GitHub visibility, branch protection, Actions, secrets | **NEXT AFTER AIPT-0007** |
| AIPT-0009 | Create 90-day GitHub milestone/issues/labels by wave | NOT STARTED |
| AIPT-0010 | Freeze major redesign until analytics/CRO evidence | NOT STARTED / POLICY ALREADY OBSERVED |

After AIPT-0007 is merged and verified as the canonical SSOT, update its state in this table to **COMPLETE**.

### Later waves

Subsequent work includes brand/commercial truth, technical SEO/slug/canonical architecture, measurement, product/media scale, content, CRO, payments, customer/account operations, and security hardening.

Do not treat later-wave ideas as approved implementation merely because they appear in planning documents.

---

## 22. Current explicit blockers/debts

### Measurement debt

Authenticated Search Console export is unavailable in the current tool surface. AIPT-0005 remains incomplete.

### GitHub governance debt

At SSOT creation, `main` is not protected. Repository visibility/branch protection/Actions/secrets review belongs to AIPT-0008.

### SEO architecture debt

Soft 404 behavior, missing slug/SEO metadata, thin descriptions, and missing first-party media relationships remain open according to issue #20.

### Production-documentation debt

`PRODUCTION_SETUP.md` on `main` is stale at SSOT creation. Corrected documentation exists in PR #279. Until merged, this master SSOT and verified code/config/runtime evidence take precedence over stale statements in the old production setup file.

### Dual-backend drift debt

Local Express/Postgres and production Pages Functions/D1 remain separate implementations.

### Commercial truth debt

Historical/shared-access offers require provider/SKU review; do not assume historical availability equals current eligibility.

---

## 23. Standard task execution protocol

For each roadmap item:

1. read this master SSOT;
2. identify the exact roadmap task and acceptance criteria;
3. verify relevant current production/code/provider evidence;
4. create a focused branch from the correct verified base;
5. make the smallest safe change;
6. typecheck/test/build where applicable;
7. inspect the diff for accidental scope expansion;
8. open/update a PR with explicit safety/rollback notes;
9. merge only when the task genuinely benefits from landing on `main` and gates pass;
10. if merged, verify production deployment/monitoring where the merge can affect runtime;
11. update roadmap state/evidence;
12. update this SSOT when architecture, authority, blockers, or roadmap state materially changes.

For documentation-only work, do not invent deployment risk, but remember that this repository's `main` workflow may still trigger a production deployment on merge.

---

## 24. Acceptance vocabulary

Use these terms consistently:

- **NOT STARTED** — no material execution yet.
- **IN PROGRESS** — active work, acceptance gate not reached.
- **PARTIAL** — useful verified output exists but required scope is incomplete.
- **BLOCKED** — acceptance requires unavailable access/evidence/dependency.
- **PASS** — acceptance criteria met for the task scope.
- **COMPLETE** — task is durably recorded and no required acceptance item remains.
- **PRODUCTION VERIFIED** — the relevant live system behavior was independently checked after deployment.

Do not use “COMPLETE” for an implementation that still requires a mandatory production check.

---

## 25. Evidence map

Primary implementation/evidence locations:

- `wrangler.toml` — Cloudflare Pages/D1/R2 bindings
- `.github/workflows/deploy.yml` — canonical validation/deployment pipeline
- `.github/workflows/aipt-production-backup.yml` — encrypted production backup/offsite artifact pipeline
- `.github/workflows/continuous-production-monitor.yml` — production health monitor
- `.github/workflows/commerce-data-integrity-watch.yml` — commerce/data invariants
- `.github/workflows/deep-seo-content-audit.yml` — automated SEO/content audit
- `functions/api/[[path]].ts` — primary production API router
- `functions/media/[[key]].ts` — first-party media serving + protected backup namespace
- `functions/internal/aipt-backup.ts` — runtime encrypted backup
- `functions/internal/aipt-backup-export.ts` — authenticated encrypted export
- `d1/migrations/` — source-controlled D1 migration history
- `d1/PRODUCTION_MIGRATION_TARGET` — expected production schema target
- `docs/operations/AIPT-0003-DATA-BACKUP-RECOVERY.md` — backup/recovery runbook
- `docs/operations/AIPT-0004-R2-INVENTORY-RETENTION-RESILIENCE.md` — R2/offsite recovery policy
- `docs/audit/` — dated audit evidence
- GitHub issue #20 — current automated organic-growth/SEO backlog
- PR #278 — AIPT-0005 GSC baseline evidence/blocker
- PR #279 — corrected production setup documentation

Recovery private-key material is intentionally **not** in this evidence map as a repository value. Its custody is outside GitHub.

---

## 26. How to update this SSOT

Update this file when any of the following materially changes:

- canonical production host/platform;
- Cloudflare project/D1/R2 identity;
- deployment or migration workflow;
- backup/recovery architecture;
- authentication/security model;
- canonical route/URL architecture;
- commercial eligibility model;
- roadmap task/gate state;
- authoritative measurement source;
- major known blocker/debt;
- authority hierarchy or business-unit isolation rule.

Do not rewrite historical task evidence to make the present look cleaner. Preserve dated runbooks/PRs and update current state here.

Volatile counts (product count, sitemap count, SEO findings, traffic) must carry a date/source or point to the automation/report that is authoritative.

---

## 27. Definition of success

AIPT is not successful merely because the site is online or because traffic rises.

The operating system succeeds when AIPT is simultaneously:

- recoverable;
- secure enough for its current risk profile;
- commercially truthful;
- provider-compliant at SKU level;
- measurable;
- indexable and technically sound;
- useful to Bangladeshi customers;
- operationally efficient;
- increasingly discoverable through search/LLM/referral channels;
- profitable with known unit economics;
- maintainable by future humans/agents without relying on private chat history.

That final requirement is the reason this file exists.
