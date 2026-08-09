# Production Architecture

Live at https://aipremium.tools — Cloudflare Pages (storefront) + Cloudflare
Pages Functions (API) + Cloudflare D1 (database). No dependency on Replit,
Vercel, or any machine staying online.

## Why D1 instead of Postgres in production

Local dev uses Postgres (`artifacts/api-server`, Express) because that's what
the original schema/codegen pipeline was built around. Production uses D1
(SQLite) because it's native to the Cloudflare account already hosting the
site — no new third-party account/signup required. The two run genuinely
different code:

- **Local**: `artifacts/api-server` (Express + Drizzle + Postgres) — see
  `LOCAL_DEV_SETUP.md`.
- **Production**: `functions/api/[[path]].ts` (Cloudflare Pages Function,
  raw D1 SQL) — a hand-written port of the same routes/business logic
  (see `lib/api-spec/openapi.yaml` for the contract both must satisfy).

**If you change an API route, update both.** There's no shared code path
between them by design (D1 is SQLite, not Postgres — Drizzle's Postgres
queries don't run against it as-is).

## Resources

- D1 database: `aipt-db` (id `9c19dfdb-aead-4bed-b6ff-f6bf379bc296`, region APAC)
- Pages project: `ai-premium-tools`
- Config: `wrangler.toml` (repo root) — D1 binding (`DB`), Pages build output dir
- Secrets (Pages → Settings → Environment variables): `ADMIN_PASSWORD`, `SESSION_SECRET`

## Schema and seed data

- `d1/schema.sql` — SQLite DDL, mirrors `lib/db/src/schema/*.ts` (Postgres)
  as closely as SQLite's type system allows (booleans as 0/1, timestamps as
  unix-ms integers, `features` as JSON text).
- `d1/seed.sql` — generated snapshot of categories + products, **not**
  hand-edited. Upserts only (`ON CONFLICT(id) DO UPDATE`) — it never deletes
  or touches `orders`, `order_items`, `reviews`, or a product's live
  `order_count`, so it's safe to run against production at any time.
  Regenerate from the local Postgres dev DB after catalog changes:
  ```
  cd scripts
  DATABASE_URL=postgresql://... pnpm run export-to-d1
  cd ..
  npx wrangler d1 execute aipt-db --remote --file=d1/seed.sql
  ```

## Deploying

No working GitHub Actions deploy yet (GitHub billing lock on the account —
see below). Deploy manually:

```
PORT=8080 BASE_PATH=/ VITE_SITE_URL=https://aipremium.tools \
  pnpm --filter @workspace/aipt-store run build

npx wrangler pages deploy artifacts/aipt-store/dist/public \
  --project-name=ai-premium-tools --commit-dirty=true
```

This uploads both the static build and the `functions/` API bundle in one
step — `wrangler` finds `functions/` relative to the current working
directory (repo root), not the deployed asset directory.

Once `.github/workflows/deploy.yml` can run again (GitHub Actions is
currently billing-locked on this account, unrelated to this project), it
will deploy the frontend automatically on push to `main` — but the
Functions/D1 side still needs the same manual `wrangler pages deploy` step
since the workflow doesn't (yet) run D1 migrations.

## Known gaps

- Admin routes (`PUT /products/:id` partial, category CRUD) are implemented
  but not as thoroughly exercised as the customer-facing flow (browse → cart
  → checkout → order confirmation → admin dashaboard), which has been
  verified live end-to-end.
- No automated D1 migrations — schema changes are applied by hand via
  `wrangler d1 execute --file=d1/schema.sql` (idempotent, uses
  `CREATE TABLE IF NOT EXISTS`).
- Notion sync (`lib/notion-sync`, used by the local Express server) has no
  D1 equivalent — production order/product changes don't mirror to Notion.
