# AIPT Production Baseline — AIPT-0001

**Status:** CAPTURED — NO PRODUCTION CHANGE PERFORMED  
**Baseline date:** 2026-09-03 (Asia/Dhaka)  
**Canonical production:** https://aipremium.tools  
**Repository:** `sysmoai/AI-Premium-Tools`  
**Purpose:** Freeze the pre-growth state so every subsequent AIPT change can be compared, tested, and rolled back against a known reference.

---

## 1. Non-destructive baseline rule

AIPT-0001 is evidence capture only. It MUST NOT change production UI, product data, routing, pricing, checkout behavior, database state, media state, DNS, Cloudflare configuration, or commercial eligibility.

All later work must preserve existing ranking/conversion assets unless a documented change has:

1. a baseline comparison,
2. an acceptance test,
3. a rollback path,
4. a preview/CI validation step, and
5. a post-deploy production verification.

---

## 2. Source-control freeze point

| Item | Baseline value |
|---|---|
| Default branch | `main` |
| Baseline main SHA | `28da818cd1682cd617d4420bb98925a502dbe759` |
| Baseline commit message | `Merge pull request #32 from sysmoai/fix/supervisor-retry-fixed-watchdogs` |
| Baseline tree SHA | `5f1e2ada9d868becca6d197a143114816e07d230` |
| Main branch protected | **No** — GitHub branch metadata reports `protected: false` |
| Baseline documentation branch | `ops/aipt-0001-baseline-2026-09-03` |

**Important:** The unprotected `main` branch is not changed in AIPT-0001. Branch protection is an AIPT-0008 control task.

---

## 3. Production architecture baseline

Current production architecture is Cloudflare-native:

- **Storefront:** Cloudflare Pages
- **Production API:** Cloudflare Pages Functions
- **Production database:** Cloudflare D1, binding `DB`
- **D1 database:** `aipt-db`
- **D1 database ID:** `9c19dfdb-aead-4bed-b6ff-f6bf379bc296`
- **Media storage:** Cloudflare R2, binding `MEDIA`
- **R2 bucket:** `aipt-media`
- **Cloudflare Pages project:** `ai-premium-tools`
- **Production migration target:** `0002_catalog_media_foundation.sql`
- **Frontend:** React/Vite/TypeScript
- **Routing:** Wouter SPA routes
- **Catalog/client data:** TanStack React Query
- **Local development backend:** Express + Drizzle + PostgreSQL
- **Production backend implementation:** raw D1 SQL in Pages Functions

The local Express/Postgres backend and production Pages Functions/D1 backend are separate implementations. Any API contract change must be reviewed for dual-backend drift until that architecture is intentionally changed.

---

## 4. CI/CD baseline

`.github/workflows/deploy.yml` currently performs:

1. checkout,
2. pnpm install with lockfile,
3. typecheck,
4. storefront tests,
5. local D1 migration validation,
6. storefront production build,
7. verified repository migration-target guard,
8. production Cloudflare Pages D1-binding identity check,
9. Cloudflare Pages deploy,
10. immutable deployment health/API/schema checks,
11. canonical-domain propagation and health verification.

This current workflow supersedes stale prose in `PRODUCTION_SETUP.md` that still describes GitHub Actions deployment as unavailable/manual. Correcting that documentation is AIPT-0006, not AIPT-0001.

---

## 5. Public route surface frozen for regression testing

The current application declares and/or continuously monitors these customer-facing routes:

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

Current admin routes include:

- `/admin`
- `/admin/orders`
- `/admin/products`
- `/admin/products/:id/media`
- `/admin/media`
- `/admin/customers`

These routes form the minimum pre/post-deploy regression set. Existing URLs must not be deleted or silently repurposed in later waves.

---

## 6. Continuous-production monitor baseline

The repository contains `Continuous AIPT Production Monitor`, scheduled every 15 minutes and also triggered after the production deploy workflow. Its current invariants include:

### Public routes expected to return 200
- Homepage
- Products
- Cart
- Checkout
- Order tracking
- FAQ
- About
- Contact
- Shipping policy
- Refund policy
- Privacy policy
- Terms

### API/data invariants
- `/api/healthz` => status `ok`
- `/api/products` => non-empty product array
- `/api/db-schema` => verified migration `0002_catalog_media_foundation.sql`
- product detail API returns valid product
- product-media API returns an items array

### Security invariants
Unauthenticated access must be rejected for:
- media library
- customer list
- order list
- admin dashboard stats
- media upload POST

### Machine-readable/SEO invariants
- `robots.txt` exists and declares canonical sitemap
- `sitemap.xml` exists and contains canonical AIPT URLs
- `llms.txt` exists and is non-trivial
- web app manifest is valid

The historical production-monitor incident is GitHub issue #24. It recovered and was automatically closed on 2026-08-10. At the AIPT-0001 capture, there is **no open issue titled `[monitor] AIPT production health incident`**.

---

## 7. Current organic/SEO production audit snapshot

Source: GitHub issue #20, automatically updated **2026-09-03T04:36:48.833Z**.

| Signal | Baseline |
|---|---:|
| Live products | **71** |
| Sitemap URLs | **89** |
| P0 findings | **0** |
| P1 findings | **4** |
| P2 findings | **3** |

### Current P1 findings
1. Product detail missing-item routes have a soft-404 pattern: invalid product API is 404, but `/products/999999999` returns HTTP 200.
2. **71/71** products lack explicit `seo_description`.
3. **71/71** products lack explicit `seo_title`.
4. **71/71** products lack stable SEO `slug`.

### Current P2 findings
5. **71/71** products lack `short_description`.
6. **71/71** products have zero `product_media` relationships.
7. **2/71** product descriptions are under 80 characters.

These are baseline gaps, not changes made by AIPT-0001.

---

## 8. Search/indexing baseline observations

Public web/search inspection on 2026-09-03 confirms the canonical domain and a content-rich homepage are discoverable, with current catalog messaging around 71+ tools. Historical indexed/cache evidence also includes prior deep-route asset/loading failures and an empty category result.

Those historical search/cache artifacts are retained as regression evidence. They must **not** be interpreted as proof of a current live outage without a fresh production probe. The current deep production audit reports P0=0.

Protected search assets for all later work:

- canonical domain `https://aipremium.tools`
- existing product numeric URLs until exact redirect mappings exist
- existing policy/help pages
- homepage intent and current organic landing-page surface
- sitemap URL inventory
- existing indexed content that already receives organic demand

No URL migration may occur before AIPT-0201+ acceptance criteria are satisfied.

---

## 9. Current storefront implementation baseline

`App.tsx` currently:

- eager-loads Home for first paint,
- lazy-loads other store/admin pages,
- uses Wouter routes,
- uses React Suspense skeleton fallback,
- wraps UI in ErrorBoundary,
- uses client-side admin-state markers in localStorage in addition to backend auth enforcement,
- keeps navbar/footer off admin routes.

Historical lazy-chunk failures seen in search/cache are therefore relevant regression evidence for later deep-route resilience work.

---

## 10. Brand baseline

Canonical repository brand system currently states:

- **Name:** AIPT
- **Tagline:** Affordable AI Subscriptions in Bangladesh
- **Primary visual direction:** Deep Purple `#7C3AED` + blue
- **Heading typeface:** Outfit
- **Body typeface:** Plus Jakarta Sans
- **Tone:** student-friendly, trustworthy, conversion-focused, clean, modern

Existing favicon/mark uses a purple-to-blue gradient and white A/T-style construction.

**Brand protection rule:** do not substitute AIPS, AITP, SaveOnSub, SYSmoAI, EMON RPM, or any other business-unit logo/brand asset. A full approved AIPT logo pack must be explicitly identified/canonicalized before a broad visual rollout.

---

## 11. Commerce baseline

Current customer journey surfaces include:

`Organic/product landing -> product detail -> cart -> checkout -> order success -> order tracking`

Production monitoring explicitly verifies checkout is reachable and protects authenticated order/customer/admin APIs. Server-side commerce logic is the authority for price/order calculations; future analytics must not treat a client page-load as confirmed revenue.

AIPT-0001 performs no checkout submission, payment, product mutation, or order mutation.

---

## 12. Production data baseline boundaries

AIPT-0001 records architecture and externally verified counts only. It intentionally does **not** mutate or export D1/R2 because those are separate protected steps:

- **AIPT-0003:** D1 Time Travel bookmark + durable export + restore documentation
- **AIPT-0004:** R2 inventory + retention/backup expectations

Do not mark database/media backup complete from this document alone.

---

## 13. Rollback reference for future work

Until AIPT-0002 creates a formal Git tag/release reference, the source rollback anchor for this baseline is:

`28da818cd1682cd617d4420bb98925a502dbe759`

A source rollback is not equivalent to a database rollback. Any later schema/data change must also have a D1-specific recovery plan.

---

## 14. Pre-change acceptance gate

Before any growth or redesign PR is allowed to deploy, compare against this baseline and verify at minimum:

- [ ] homepage remains reachable
- [ ] product listing remains reachable
- [ ] existing product URLs remain reachable or have exact intended redirects
- [ ] cart remains reachable
- [ ] checkout remains reachable
- [ ] order tracking remains reachable
- [ ] policy/help pages remain reachable
- [ ] `/api/healthz` remains healthy
- [ ] product API remains non-empty
- [ ] D1 schema health remains valid
- [ ] protected admin/customer/order/media APIs still reject unauthenticated requests
- [ ] robots/sitemap remain canonical
- [ ] product count does not unexpectedly decrease from 71
- [ ] sitemap count does not unexpectedly decrease from 89 without an approved URL-removal plan
- [ ] no current organic landing URL is deleted without redirect/indexing analysis
- [ ] production monitor has no open incident after deployment

---

## 15. AIPT-0001 completion record

**AIPT-0001 acceptance criterion:** "Baseline record saved; current live behavior can be compared after each change."

### Result
**PASS — baseline evidence has been captured on an isolated documentation branch without changing production.**

### Evidence anchors
- Main SHA: `28da818cd1682cd617d4420bb98925a502dbe759`
- Production audit issue #20: 71 products / 89 sitemap URLs / P0=0 / P1=4 / P2=3 as of 2026-09-03T04:36:48.833Z
- Production monitor issue #24: historical incident closed after recovery
- No open current production-health incident found at capture time
- Current Cloudflare architecture and deploy guards recorded
- Current route/API/security/SEO monitor surface recorded
- No production mutation performed

### Next step
Proceed to **AIPT-0002 — create a formal Git release tag / protected baseline commit reference** before growth work.