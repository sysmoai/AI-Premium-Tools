# Local Development Setup (no Replit, no Docker)

Verified working end-to-end on 2026-08-05: storefront, categories, product
detail, cart, and admin dashboard all render correctly against a real local
Postgres — no crashes, no missing data.

## 1. Install dependencies

```
pnpm install
```

## 2. Get a local Postgres running

No Docker needed — a portable PostgreSQL binary works fine on Windows without
admin rights:

```
curl -L -o pg.zip https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64-binaries.zip
unzip -q pg.zip
./pgsql/bin/initdb.exe -D ./pgdata -U postgres --pwfile=<(echo yourpassword) -E UTF8
./pgsql/bin/postgres.exe -D ./pgdata -p 5433 -k ./pgdata &
./pgsql/bin/createdb.exe -h 127.0.0.1 -p 5433 -U postgres aiptdb
```

Any local Postgres works — this is just the no-admin-rights, no-Docker path.

## 3. Push the schema and seed data

```
cd lib/db
DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5433/aiptdb" pnpm run push

cd ../../scripts
DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5433/aiptdb" pnpm run seed-categories
DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5433/aiptdb" pnpm run seed-products
```

`seed-categories` must run before `seed-products` — the product seed looks up
category IDs by slug and fails if they don't exist yet.

## 4. Start the API server

```
cd artifacts/api-server
DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5433/aiptdb" PORT=8080 pnpm run dev
```

## 5. Start the storefront

```
cd artifacts/aipt-store
PORT=24965 BASE_PATH=/ pnpm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:8080` (see
`vite.config.ts`) — set `API_PORT` if the API server runs on a different port.

Visit http://localhost:24965.

## Known gaps vs. the original Replit instance

- **Product count**: 71 products here vs. 99+ that existed in Replit's
  database. The extra ~28 products and any other Replit-only data were never
  captured in `seed-products.ts` and were not recoverable — the Replit account
  is suspended (billing) and its compute/database are paused, blocking any
  export. If that data still matters, it can only be recovered by reactivating
  the Replit account.
- **Notion sync**: fails silently by design (fire-and-forget) without
  `REPLIT_CONNECTORS_HOSTNAME` / Replit Notion connector credentials — this is
  expected outside Replit and does not affect the app.
- **Customer/order/review data**: none locally (Replit's dev DB had 5
  customers, 3 orders, 2 reviews — same recovery blocker as above).
