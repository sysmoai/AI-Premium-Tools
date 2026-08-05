# ISSUES_FOUND

## P0
None - build passes

## P1 (Fixed)
- Footer social links -> aiptbd
- Footer WhatsApp links -> internal
- Duplicate getItemGradient removed
- App-wide crash when API unreachable: `categories?.map`/`categories?.find` threw because Vite dev server had no `/api` proxy, so unmatched `/api/*` calls fell through to the SPA's `index.html` (200 OK, HTML body) instead of a real error. The client parsed that HTML as response data and passed a truthy non-array to components expecting `Category[]`. Fixed by adding `server.proxy` for `/api` in `vite.config.ts` (targets `API_PORT`, default 8080) plus defensive `= []` defaults on every `useListCategories()` call site (navbar, footer, home, products, admin/products) so a real API outage degrades gracefully instead of white-screening.

## P1 (Needs verification once API+DB are live)
- Deploy pipeline (`.github/workflows/deploy.yml`) is non-functional as written: uses `npm install` against a pnpm workspace, swallows all failures via `continue-on-error: true`, runs `wrangler pages deploy .` on the repo root instead of the Vite build output (`artifacts/aipt-store/dist/public`), and has no hosting plan for the Express/Postgres API server at all.
- Browser QA now done for homepage + about with no DB; full catalog/checkout flow still needs a real `DATABASE_URL` to verify end-to-end.

## P2
- 1MB+ bundle
- Admin localStorage auth
- No test framework
