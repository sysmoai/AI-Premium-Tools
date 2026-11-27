# AIPT System Baseline

> **Historical snapshot only.** This file records the AIPT state captured on 2026-08-10 and must not be treated as the current operating SSOT. For current authority, roadmap/gates, architecture coordination, and evidence hierarchy, use [`docs/AIPT_MASTER_SYSTEM.md`](./AIPT_MASTER_SYSTEM.md). Where this snapshot conflicts with verified runtime/code/configuration or the master SSOT, the newer verified source wins.

Snapshot date: 2026-08-10 (Asia/Dhaka)

This document is the implementation baseline for AI Premium Tools (AIPT). It is intentionally descriptive: it records current verified architecture and counts before further product, UX, SEO, infrastructure, or growth work.

## Canonical production

- Canonical public domain: `https://aipremium.tools`
- Source repository: `sysmoai/AI-Premium-Tools`
- Canonical production platform: Cloudflare Pages
- Cloudflare Pages project: `ai-premium-tools`
- Production API: Cloudflare Pages Functions
- Production database: Cloudflare D1, binding `DB`, database `aipt-db`
- Production media target: Cloudflare R2, binding `MEDIA`, bucket `aipt-media`
- Current main baseline SHA at snapshot: `d5a27e15074fe65d9688211b92c163d105ee5695`
- Latest GitHub Actions Cloudflare deployment for that SHA: successful

## Frontend stack

- React + TypeScript
- Vite
- Wouter routing
- TanStack React Query
- Tailwind CSS
- Radix UI primitives
- React Hook Form + Zod ecosystem
- Framer Motion
- Recharts
- Vitest + Testing Library/jsdom

## Page and route inventory

There are 18 explicit routed page patterns in `App.tsx`: 14 public/store routes and 4 admin routes, plus a fallback 404 route.

### Public/store route patterns (14)

1. `/`
2. `/products`
3. `/products/:id`
4. `/cart`
5. `/checkout`
6. `/order-success/:id`
7. `/track-order`
8. `/faq`
9. `/about`
10. `/contact`
11. `/shipping-policy`
12. `/refund-policy`
13. `/privacy-policy`
14. `/terms`

Fallback: `NotFound`.

### Admin route patterns (4)

1. `/admin`
2. `/admin/orders`
3. `/admin/products`
4. `/admin/customers`

The admin page directory contains 5 components: login, dashboard, orders, products, customers. The login component is reused as the access gate for the four admin route patterns.

### Page component count

- Public page components including NotFound: 15
- Admin page components including Login: 5
- Total page components: 20

## Catalog inventory

Current repository D1 seed contains:

- 71 product rows
- 8 categories
- All 71 seed rows are active in the snapshot

Category distribution:

- AI Text & Writing: 20 products
- AI Image & Design: 11 products
- AI Productivity: 7 products
- AI Video & Audio: 10 products
- Student Packages: 6 products
- Freelancer Packages: 7 products
- AI Code & Dev: 6 products
- AI Automation: 4 products

Important: this is the current repository/D1 seed count. The exact live D1 row count should be periodically verified directly against production D1; do not silently assume the seed and live database can never diverge.

## Production database

D1 schema contains 6 tables:

1. `categories`
2. `products`
3. `customers`
4. `orders`
5. `order_items`
6. `reviews`

Current schema also defines indexes for product filtering, order lookup/status/date, order items, and reviews.

The production seed is now non-destructive: it upserts catalog categories/products and does not delete orders, order items, reviews, or overwrite live product order counts on conflict.

## Production API surface

The main Pages Function router implements 22 core endpoint patterns:

1. `GET /api/healthz`
2. `GET /api/categories`
3. `POST /api/categories`
4. `PUT /api/categories/:id`
5. `DELETE /api/categories/:id`
6. `GET /api/products`
7. `POST /api/products`
8. `GET /api/products/:id`
9. `PUT /api/products/:id`
10. `GET /api/products/:id/reviews`
11. `POST /api/reviews`
12. `POST /api/customers`
13. `GET /api/customers`
14. `GET /api/customers/:id`
15. `POST /api/orders`
16. `GET /api/orders`
17. `GET /api/orders/:id`
18. `PATCH /api/orders/:id/status`
19. `POST /api/admin/login`
20. `GET /api/stats/dashboard`
21. `GET /api/stats/recent-orders`
22. `GET /api/stats/top-products`

Media adds two additional runtime endpoint patterns:

23. `POST /api/media/upload`
24. `GET /media/<object-key>`

## Authentication and safety

- Production admin auth is server-side and uses `ADMIN_PASSWORD` + `SESSION_SECRET` bindings.
- Hard-coded production fallback password/session-secret behavior has been removed from the main API handler.
- Pages middleware fails closed when required admin auth configuration is absent.
- Commerce writes are guarded by the emergency `COMMERCE_ENABLED` gate until commercial/provider eligibility is explicitly approved.
- Never commit secret values to Git.

## Media architecture

`wrangler.toml` binds R2 bucket `aipt-media` as `MEDIA`.

Current media upload code:

- requires admin bearer authentication
- accepts JPEG, PNG, WebP, GIF, MP4, WebM
- maximum file size: 25 MB
- generates UUID-based object keys
- stores content type/cache metadata
- serves through first-party `/media/...` URLs

Current gap: the internal admin product UI still primarily expects an image URL field; a complete media library/uploader UX should be added before calling the media system finished.

## CI/CD

Pushes to `main` run:

1. checkout
2. pnpm setup
3. Node setup
4. dependency install
5. workspace typecheck
6. storefront tests
7. storefront build
8. Cloudflare Pages deployment with Wrangler action

The latest workflow for the baseline main SHA completed successfully.

## Local development architecture

Local development is intentionally different from production today:

- Local API: Express
- ORM: Drizzle
- Local database: PostgreSQL
- Production API: Cloudflare Pages Functions
- Production database: D1/SQLite with raw SQL

This creates duplicated route/business logic. Any backend behavior change must currently be reconciled between the local Express implementation and production Pages Function implementation.

## Current duplicate deployment surfaces

These are not canonical production but still exist and must be handled carefully:

- GitHub Pages is publicly enabled from `gh-pages`. The branch has been converted toward a noindex/redirect role, but the public surface still exists.
- A Vercel project `ai-premium-tools-aipt-store` is still connected to the GitHub repository and creates production deployments from `main`.

Canonical public production must remain `https://aipremium.tools` on Cloudflare. Retire or neutralize duplicate hosts only after independent verification that they do not contain unique required functionality/data.

## Current known gaps / priorities

### P0 — protect production and trust

- Rotate any credentials that were historically exposed in public Git history if not already rotated.
- Keep admin auth fail-closed and regression-tested.
- Do not enable questionable/shared credential commerce merely because the UI can sell it; enforce provider/commercial eligibility server-side.
- Keep production data migrations non-destructive.

### P1 — architecture/reliability

- Add a real migration workflow for D1 instead of relying only on idempotent schema execution.
- Reduce or eliminate duplicated local Express vs production Pages Function business logic.
- Add production observability and smoke checks after deployment.
- Resolve stale production documentation when behavior changes.

### P1 — media/admin

- Add an authenticated admin media library/uploader using R2.
- Allow selecting uploaded media for products instead of pasting arbitrary external image URLs.
- Add image alt text / dimensions and video poster/preload controls where applicable.

### P1 — SEO

- Fix soft-404 behavior for missing product URLs such as historically indexed numeric product URLs.
- Verify robots.txt and sitemap against the canonical domain.
- Keep admin/private/order pages noindex where appropriate.
- Add/verify canonical metadata and structured product data.

### P1 — deployment hygiene

- Keep Cloudflare as the single canonical production runtime.
- Stop duplicate Vercel production deployment once verified safe to disable.
- Keep GitHub Pages only as a redirect/noindex or disable it after canonical verification.

### P2 — product and conversion quality

- Improve catalog taxonomy, product comparison, filters, trust signals, checkout UX, mobile experience, accessibility, and product-specific FAQs.
- Replace third-party logo/image dependencies with owned/R2-hosted media where practical.
- Add stronger admin workflows for product lifecycle, media, inventory, order operations, and review moderation.

### P2 — growth foundation

- Establish reliable first-party analytics/search-console measurement before claiming growth wins.
- Build Bangladesh-specific SEO landing pages around legitimate user intent rather than thin keyword pages.
- Create high-quality Bangla/English educational content, comparison content, and support content around tools actually offered.
- Track conversion rate, qualified organic traffic, repeat customers, support SLA, refund/failure rate, and product-level margin/availability.

## Safe development protocol

Every meaningful future change should follow:

1. verify current production truth
2. create a focused feature/fix branch
3. make the smallest reversible change
4. typecheck
5. test
6. build
7. review diff/PR
8. merge only when checks pass
9. deploy through canonical Cloudflare flow
10. independently verify `https://aipremium.tools`
11. update this baseline/gap register when architecture or counts materially change

Do not perform destructive production D1 operations, Git history rewrites, domain ownership changes, billing changes, or irreversible infrastructure deletion without explicit owner approval.

## Growth objective

The operating objective is to make AIPT a high-trust, high-quality AI tools provider for Bangladesh. "#1" is a business outcome, not a status that should be claimed without evidence. Development should prioritize trust, legal/provider compliance, reliability, transparent offers, strong local UX, fast support, useful content, SEO quality, and measurable customer outcomes.