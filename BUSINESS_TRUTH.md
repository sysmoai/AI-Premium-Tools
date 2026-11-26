# BUSINESS TRUTH

This repository is **AIPT — AI Premium Tools**.

- Canonical repository: `sysmoai/AI-Premium-Tools`
- Canonical production domain: `https://aipremium.tools`
- Canonical Cloudflare Pages project: `ai-premium-tools`
- Canonical production D1 database: `aipt-db` (`9c19dfdb-aead-4bed-b6ff-f6bf379bc296`)
- AIPT is operationally separate from AIPS, AITP, SaveOnSub, SYSmoAI, and other business units. Do not mix customer data, catalog state, brand copy, credentials, analytics, or deployment state across units.

## Commercial truth

AIPT public commerce is governed by the approved pricing/access register revision `aipt-pricing-v2-2026-09-17`.

Canonical controls:
- Human-readable SSOT: `ops/aipt-pricing-v2.json`
- Runtime allow-list and price/access rules: `functions/lib/commercial-policy.ts`
- Public API + checkout firewall: `functions/_middleware.ts`
- Production D1 normalization: `scripts/ops/aipt-commercial-v2-pages-function.ts`
- Build/CI parity audit: `scripts/aipt-pricing-policy-audit.mjs`

Rules:
- Direct checkout is allowed only for products mapped to an approved current price and supported access model.
- Public `/api/products` output is fail-closed: a D1 row is not public if its name, active state, BDT price, or commercial state does not match the runtime allow-list.
- Order creation re-checks the same runtime rule in the write request. A mismatch returns `PRICE_REVIEW_REQUIRED`; the database value is never silently trusted as the approved selling price.
- Prefer customer-specific activation on the customer's own account where the provider supports it.
- Provider-supported team/workspace seats use `AUTHORIZED_SEAT` and must satisfy the provider's current minimum-seat requirement before checkout. Claude Team Standard is currently governed as an authorized workspace seat with a two-seat minimum.
- Use provider-supported team/workspace seats only when the provider structure is confirmed.
- Do not present shared credentials, unverified bundles, dynamic/localized checkout prices, legacy tiers, or ambiguous enterprise/team offers as fixed-price direct-sale products.
- Shared-credential rows remain retained only for audit/history and must be `PROHIBITED`, inactive, and non-indexed.
- Before an order is accepted, the D1 price must match the approved server-side price. Any mismatch is `PRICE REVIEW REQUIRED` and must fail closed.
- Do not double-count VAT/tax already included or collected by the provider.
- Blanket claims such as fixed one-hour activation, universal replacement warranties, unsupported savings percentages, customer-count claims, ratings, or '#1/most affordable' claims require current evidence and must not be published by default.
- Raw legacy catalog/seed files are not commercial truth and must never override the governed production projection.

## Contact and operations

Public contact/payment details must come from the storefront configuration and current production environment rather than being duplicated as permanent constants in this file. Current public site support is via AIPT's own channels and BDT payment methods.
