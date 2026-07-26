# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full ecommerce site for **AI Premium Tools (AIPT)** — a Bangladesh-based AI tool subscription business targeting university students.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

```
artifacts/
  aipt-store/     React + Vite storefront + admin panel (serves at /)
  api-server/     Express 5 REST API (serves at /api)
lib/
  api-spec/       OpenAPI spec (openapi.yaml) + Orval codegen config
  api-zod/        Generated Zod schemas (single-file mode)
  api-client-react/ Generated React Query hooks + TypeScript types
  db/             Drizzle schema + migrations
```

## AIPT Business Details

- **Brand**: Deep Purple / Blue gradient, Outfit + Plus Jakarta Sans fonts
- **Tagline**: "Superior AI, Surprising Prices"
- **Market**: Bangladesh — BDT (৳) currency, NOT USD
- **Payment methods**: bKash, Nagad, bank_transfer (never USD/PayPal)
- **Products**: 29 AI tool subscriptions seeded from Notion
- **Categories**: AI Text & Writing, AI Image & Design, AI Productivity, AI Video & Audio, Student Packages, Freelancer Packages

## Frontend Pages

### Storefront
- `/` — Homepage (hero, stats, categories, featured products, why AIPT, CTA)
- `/products` — Full product catalog with search + category filter
- `/products/:id` — Product detail + purchase card
- `/cart` — Cart (quantity controls, remove, order summary)
- `/checkout` — Checkout form (customer info + bKash/Nagad/bank payment)
- `/order-success/:id` — Order confirmation with full order details

### Admin (password: `aipt2024`, stored in `localStorage.aipt_admin`)
- `/admin` — Dashboard (stats cards, recent orders, order status breakdown)
- `/admin/orders` — Orders table with status update dropdown + pagination
- `/admin/products` — Products table with create/edit dialog
- `/admin/customers` — Customer table with search + pagination

## API Endpoints

All routes under `/api`:
- `GET /api/products` — list (filter by category, search, featured, is_active)
- `POST /api/products` — create
- `GET /api/products/:id` — get single
- `PUT /api/products/:id` — update
- `GET /api/categories` — list
- `GET /api/orders` — list (filter by status, customer_id)
- `POST /api/orders` — create order (auto-calculates total from DB prices)
- `GET /api/orders/:id` — get order with items
- `PUT /api/orders/:id/status` — update order status
- `GET /api/customers` — list customers with order stats
- `POST /api/customers` — upsert by phone number
- `GET /api/stats` — dashboard stats (revenue, orders, customers, products)

## DB Schema

- `categories` — 6 seeded categories
- `products` — 16 real AIPT products seeded from Notion data
- `customers` — phone-unique, with university field
- `orders` + `order_items` — full order history

## Codegen Notes

- Orval config uses `mode: "single"` for zod output to avoid duplicate exports
- `lib/api-zod/src/index.ts` only exports `./generated/api` (not `./generated/types`)
- After changing OpenAPI spec, run codegen then `pnpm run typecheck:libs`

## Notion Sync (Postgres → Notion)

Notion is a canonical/audit mirror of the AIPT store. Postgres remains the system of record; every customer/product/order mutation is mirrored to Notion via fire-and-forget background jobs that never block API responses.

- **Lib**: `lib/notion-sync` — pure upsert functions, no logger dep, uses Replit Notion connector via `@replit/connectors-sdk`.
- **API wrapper**: `artifacts/api-server/src/services/notion-sync.ts` — adds `syncInBackground(label, fn)` that wraps the call in `void fn().catch(logger.warn)`.
- **Hooks** (all fire-and-forget):
  - `POST /api/customers` → `upsertCustomer`
  - `POST /api/products`, `PUT /api/products/:id` → `upsertProduct`
  - `DELETE /api/products/:id` → `deleteProduct` (soft-delete: sets `Active=false` in Notion, page kept so order history stays readable)
  - `POST /api/orders`, `PATCH /api/orders/:id/status` → `upsertOrder` + `upsertCustomer` (refresh aggregate stats)
- **Idempotency**: query Notion before insert/update.
  - Customers: filter by `WhatsApp` (phone)
  - Products: filter by `PG_ID` (number)
  - Orders: filter by `Order ID = "AIPT-{id}"` (rich_text)
- **Target Notion DBs** (hardcoded in `lib/notion-sync/src/index.ts`):
  - Customers → `AIPT — Customers (CRM)` `31cc4f53-11fe-43ad-bfad-9419922e2412`
  - Orders → `SYS — Orders (CANONICAL)` `ab25c567-87d8-4bb9-a04e-42b779080eaa`
  - Products → `AIPS — Products (Catalog)` `09b32725-77f1-4289-9bc0-147b4b264539` (columns added via PATCH /v1/databases on first setup: PG_ID, Slug, Description, Price BDT, Original Price BDT, Category, Active, Featured, Order Count, Image URL, Updated At)
- **Status mapping** (AIPT → Notion `SYS — Orders`):
  - `pending` → Status "Payment Pending", Payment Status "Not Paid"
  - `confirmed` → Status "Paid", Payment Status "Paid Full"
  - `delivered` → Status "Delivered", Payment Status "Paid Full"
  - `cancelled` → Status "Churned", Payment Status "Refunded"
- **Payment method mapping**: `bkash`→"bKash", `nagad`→"Nagad", `bank_transfer`→"Bank Transfer"
- **Backfill**: `pnpm --filter @workspace/scripts run backfill-notion [products|customers|orders|all]` — runs batches of 2 in parallel with 1500ms pause. Each upsert is 2 Notion calls (query + create/update), so this caps at ~1.1 req/sec total, well under Notion's 3 req/sec limit. Retries 3x with backoff.
- **Safety guards**:
  - `upsertCustomer` throws if phone is missing (no stable identity key → would create duplicates).
  - All hooks wrapped in `syncInBackground` so Notion outages NEVER fail an API request.
