# AIPT Production Setup & Architecture

**Canonical production:** https://aipremium.tools  
**Cloudflare Pages project:** `ai-premium-tools`  
**Production database:** Cloudflare D1 `aipt-db`  
**Production media bucket:** Cloudflare R2 `aipt-media`  
**Current verified D1 migration target:** `0002_catalog_media_foundation.sql`  
**Last reconciled against production architecture:** 2026-09-03

> This document describes the current AIPT production system. It is an operational runbook, not a historical setup note. If code, Cloudflare bindings, migrations, deployment automation, or recovery architecture changes, update this file in the same change set.

## 1. Production architecture

AIPT production is fully hosted on Cloudflare and does not depend on Replit, Vercel, a developer workstation, or any machine staying online.

| Layer | Production implementation |
|---|---|
| Canonical web host | `https://aipremium.tools` |
| Storefront | Cloudflare Pages, React + Vite + TypeScript build |
| Pages project | `ai-premium-tools` |
| Pages build output | `artifacts/aipt-store/dist/public` |
| Production API | Cloudflare Pages Functions under `functions/` |
| Database | Cloudflare D1, binding `DB` |
| D1 database | `aipt-db` |
| D1 database ID | `9c19dfdb-aead-4bed-b6ff-f6bf379bc296` |
| Media/object storage | Cloudflare R2, binding `MEDIA` |
| R2 bucket | `aipt-media` |
| Production config | repo-root `wrangler.toml` |
| Automated deployment | `.github/workflows/deploy.yml` |
| Production monitoring | `.github/workflows/continuous-production-monitor.yml` and related integrity/audit workflows |
| Production backup | `.github/workflows/aipt-production-backup.yml` + encrypted recovery Functions |

The repo-root `wrangler.toml` is the source-controlled Cloudflare binding declaration:

```toml
name = "ai-premium-tools"
pages_build_output_dir = "artifacts/aipt-store/dist/public"
compatibility_date = "2026-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "aipt-db"
database_id = "9c19dfdb-aead-4bed-b6ff-f6bf379bc296"
migrations_dir = "d1/migrations"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "aipt-media"
```

Do not change these production identities casually. A database or bucket rename/rebind is a production migration and requires an explicit recovery/rollback plan.

## 2. Production and local development are intentionally different backends

AIPT currently has two backend implementations that must remain behaviorally aligned:

### Local development

- `artifacts/api-server`
- Express 5
- Drizzle
- PostgreSQL
- see `LOCAL_DEV_SETUP.md`

### Production

- `functions/api/[[path]].ts`
- Cloudflare Pages Functions
- raw D1 SQL / SQLite semantics
- D1 binding: `DB`

The public API contract is represented by `lib/api-spec/openapi.yaml`.

**Important drift rule:** when an API route or business rule changes, inspect and update both the local Express/Postgres implementation and the production Pages Functions/D1 implementation unless the change is explicitly production-only or local-only. There is no single shared database query layer between Postgres and D1.

## 3. R2 media architecture

Production media is stored in R2 bucket `aipt-media` and exposed to the application through the `MEDIA` binding.

Relevant production code includes:

- `functions/media/[[key]].ts` — customer-facing media delivery
- production/admin media APIs — media asset management and product-media relationships
- `functions/internal/aipt-backup.ts` — encrypted production backup capture
- `functions/internal/aipt-backup-export.ts` — authenticated encrypted recovery export

The reserved prefix `_aipt-backups/` is recovery infrastructure, not customer media. The public media route must continue to reject that prefix.

Do not store plaintext database exports, credentials, private recovery keys, or other secrets in public media keys.

## 4. D1 schema and migrations

### Source-controlled migration system

Production schema history is under:

- `d1/migrations/0001_baseline.sql`
- `d1/migrations/0002_catalog_media_foundation.sql`

The source-controlled production target is:

- `d1/PRODUCTION_MIGRATION_TARGET`
- current value: `0002_catalog_media_foundation.sql`

The deploy workflow also verifies that the repository migration set and target match the production-approved state before a Pages deployment proceeds.

### Current catalog/media foundation

Migration `0002_catalog_media_foundation.sql` established the catalog/media foundation, including product SEO/commercial fields, `media_assets`, `product_families`, and `product_media` relationships used by the production media system.

### `d1/schema.sql` and `d1/seed.sql`

`d1/schema.sql` remains useful as a schema representation/reference, but ordered migrations are the production change mechanism.

`d1/seed.sql` is a generated catalog seed snapshot. Treat catalog seeding separately from schema migration. Never assume a seed is safe solely because it exists in the repository; review the SQL and target environment before any remote execution.

### New production migration rule

The normal deployment workflow **does not silently apply new remote D1 migrations**. This is intentional.

For a new migration:

1. create a new ordered SQL file under `d1/migrations/`;
2. validate it locally with Wrangler;
3. capture/verify a current production backup before destructive or non-trivial schema work;
4. review the SQL for data-loss/locking/backfill implications;
5. apply the migration to the exact production D1 database through the guarded production migration procedure;
6. verify the production schema and application invariants;
7. only then advance `d1/PRODUCTION_MIGRATION_TARGET` and the deploy workflow's approved migration set;
8. deploy application code that depends on the new schema only after the database is confirmed ready.

Do not replace this sequence with ad-hoc `schema.sql` execution against production.

## 5. GitHub Actions deployment is live

The historical statement that GitHub Actions was billing-locked or that AIPT required routine manual deploys is no longer true.

`.github/workflows/deploy.yml` is the canonical validation/deployment pipeline.

### Pull requests

On `pull_request`, the workflow validates but does not deploy production. It currently performs:

1. checkout;
2. pnpm setup;
3. Node.js setup;
4. frozen dependency install;
5. repository typecheck;
6. storefront tests;
7. local D1 migration validation;
8. storefront production build.

### Push to `main` / manual workflow dispatch

For non-PR execution after validation succeeds, the production job additionally:

1. rebuilds the storefront;
2. verifies the repository migration target and approved migration set;
3. verifies the Cloudflare Pages project's production `DB` binding points to the exact expected D1 database ID;
4. deploys the static build plus Pages Functions to Cloudflare Pages with Wrangler;
5. captures the immutable `*.ai-premium-tools.pages.dev` deployment URL;
6. verifies the immutable deployment health, product API, and D1 schema health;
7. waits for canonical edge propagation;
8. verifies `https://aipremium.tools`, checkout, products API, and production D1 schema state.

A failed validation or invariant check stops the deployment path.

## 6. Production deployment commands

Routine production releases should use the GitHub Actions pipeline rather than workstation-driven deploys.

The underlying build command used by CI is equivalent to:

```bash
PORT=8080 BASE_PATH=/ VITE_SITE_URL=https://aipremium.tools \
  pnpm --filter @workspace/aipt-store run build
```

The underlying Pages deployment is equivalent to:

```bash
pnpm exec wrangler pages deploy artifacts/aipt-store/dist/public \
  --project-name=ai-premium-tools
```

A manual Wrangler deployment is an emergency/operator fallback, **not** the normal release process. Before using it, reproduce the CI validation gates and confirm the exact Cloudflare account/project/bindings. Do not use a manual deploy to bypass a failing CI invariant.

## 7. Runtime secrets and GitHub deployment credentials

### Cloudflare Pages runtime secrets/variables

Production API admin authentication currently depends on runtime values including:

- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Never commit their values to the repository, documentation, PRs, issues, logs, or normal database fields.

### GitHub Actions deployment credentials

The deployment workflow expects repository Actions secrets including:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Their values must remain secret. The deploy token should have only the permissions needed for its production deployment role.

### Backup authentication

The production backup flow does **not** require a long-lived Cloudflare backup API token. It uses short-lived GitHub Actions OIDC identity validated by the production backup Functions.

Do not reintroduce a broad backup token unless there is a documented reason and least-privilege review.

## 8. Production backup and recovery

AIPT has a production-verified encrypted backup baseline.

Key components:

- `.github/workflows/aipt-production-backup.yml`
- `functions/internal/aipt-backup.ts`
- `functions/internal/aipt-backup-export.ts`
- `docs/operations/AIPT-0003-DATA-BACKUP-RECOVERY.md`
- `docs/operations/AIPT-0004-R2-INVENTORY-RETENTION-RESILIENCE.md`

Current design:

- D1 logical snapshot data is encrypted before recovery storage;
- R2 media recovery copies are encrypted and content-addressed;
- recovery objects live under reserved `_aipt-backups/` keys in `aipt-media`;
- the public media path blocks that namespace;
- GitHub Actions obtains short-lived OIDC identity for the backup/export operation;
- the workflow exports ciphertext-only recovery material as a 7-day GitHub Actions artifact;
- the first verified off-provider encrypted baseline and the private recovery key are held separately in the owner's private Google Drive recovery vault;
- the private key must never be committed to GitHub or stored in Cloudflare alongside the public key.

Do not treat a source-code rollback as a database/media restore. Source, D1, R2, runtime configuration, and external recovery artifacts are separate recovery layers.

## 9. Production health and monitoring

After production deployment, automated checks monitor customer-facing and data-integrity invariants.

At minimum, the production monitor covers core storefront routes, API health, product availability, D1 schema state, authenticated/admin guard behavior, robots/sitemap and other production invariants. Additional commerce/data integrity and SEO/content audit workflows also run around production changes.

Primary workflow references:

- `.github/workflows/continuous-production-monitor.yml`
- `.github/workflows/commerce-data-integrity-watch.yml`
- `.github/workflows/deep-seo-content-audit.yml`
- `.github/workflows/automation-supervisor.yml`

Do not declare a release successful merely because the Pages deploy command returned success. The post-deploy verification/monitoring state is part of the release gate.

## 10. Canonical production verification checklist

After a production release or recovery operation, verify at minimum:

- `https://aipremium.tools/`
- `https://aipremium.tools/products`
- representative product detail pages
- `https://aipremium.tools/cart`
- `https://aipremium.tools/checkout`
- `https://aipremium.tools/track-order`
- policy/information pages
- `/api/healthz`
- `/api/products`
- `/api/db-schema`
- representative product/media API behavior
- admin/authenticated endpoints reject unauthenticated access as expected
- `robots.txt`
- canonical sitemap behavior
- public backup namespace remains inaccessible

For changes affecting checkout/orders/media/admin, test the relevant business flow rather than relying only on generic HTTP 200 checks.

## 11. Rollback boundaries

### Source/application rollback

Use the recorded known-good source reference/rollback procedure when an application deployment must be reverted. Prefer targeted reverts over history rewriting.

### D1 rollback/recovery

Do not assume reverting Git code reverses a D1 migration or data mutation. Use the documented D1 backup/recovery procedure and require explicit human approval for destructive restoration.

### R2/media recovery

Do not delete or overwrite media in bulk as part of an application rollback. Use the encrypted media recovery inventory/manifests and restore into a controlled/staging target first whenever practical.

### Secrets/configuration

Cloudflare runtime secrets, bindings, custom-domain/DNS state, and GitHub Actions secrets are external state. A Git revert does not restore them.

## 12. Known architectural risks / rules

1. **Dual backend drift:** Express/Postgres local routes and Pages Functions/D1 production routes can diverge. Route changes require deliberate parity checks.
2. **Schema/application ordering:** code must not depend on an unapplied production migration.
3. **R2 namespace safety:** `_aipt-backups/` must never become publicly retrievable through `/media/`.
4. **Secret hygiene:** no secret values in Git, issues, PR comments, logs, screenshots, or ordinary DB text fields.
5. **Production deploy discipline:** `main` pushes can trigger a production deployment; use branch/PR validation for ordinary changes.
6. **No cross-business data mixing:** AIPT production data, assets, pricing, claims, and credentials must remain isolated from AIPS, AITP, SaveOnSub, SYSmoAI, and other portfolio units.
7. **Notion is not production SSOT:** local Notion-sync code is not a substitute for D1/R2 production truth.

## 13. Files that define production truth

When this document conflicts with live/source-controlled infrastructure, investigate before changing anything. The highest-value production references are:

- `wrangler.toml`
- `.github/workflows/deploy.yml`
- `functions/api/[[path]].ts`
- `functions/media/[[key]].ts`
- `functions/internal/aipt-backup.ts`
- `functions/internal/aipt-backup-export.ts`
- `d1/migrations/`
- `d1/PRODUCTION_MIGRATION_TARGET`
- `.github/workflows/continuous-production-monitor.yml`
- `.github/workflows/aipt-production-backup.yml`
- `docs/operations/AIPT-0003-DATA-BACKUP-RECOVERY.md`
- `docs/operations/AIPT-0004-R2-INVENTORY-RETENTION-RESILIENCE.md`

If a production architecture change makes any statement in this document false, correcting this document is part of the same change's definition of done.
