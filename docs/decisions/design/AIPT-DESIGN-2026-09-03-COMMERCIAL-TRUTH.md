# AIPT-0010 — Commercial truth presentation remediation

Owner: @sysmoai  
Decision: PROCEED  
Evidence class: COMPLIANCE

## Evidence

The source-controlled claim truth audit identified legacy public assertions that are not backed by current AIPT evidence, including ranking/superlative claims, aggregate customer/rating/savings numbers, universal fulfilment timing and warranty durations, unsupported payment methods, provider-sourcing statements, physical-return structured data for digital products, and provider-brand/seller confusion. Checkout source code verifies the current payment methods as bKash, Nagad, and Bank Transfer. The authenticated commercial inventory shows 71 active products, all currently fail-closed at `HOLD`, and the provider evidence registry does not establish blanket authorization.

## Hypothesis

Replacing unsupported assertions with live/dynamic facts and conservative policy wording will reduce compliance and trust risk without changing the core catalog/cart/checkout/order behavior. A fail-closed claim guard should prevent the legacy assertions from returning.

## Scope

- public copy and structured-data truth corrections;
- remove static/unverified testimonial and aggregate marketing claims;
- preserve live catalog pricing, cart, checkout submission, order tracking, admin APIs, and canonical URL structure;
- separate third-party provider identity from AIPT seller identity;
- remove physical-return/shipping schema that does not match digital fulfilment;
- retain the established AIPT purple/blue visual system and component library;
- no database migration and no destructive order/customer operation.

## Acceptance

- repository/business-unit isolation guard passes;
- claim truth guard passes with a current claim registry;
- AIPT-0010 design guard accepts this decision record;
- typecheck, storefront tests, local D1 migration validation and build pass;
- Cloudflare production deploy, immutable runtime verification and canonical-domain verification pass;
- production monitor, commerce/data integrity, deep SEO/content audit, encrypted backup, automation supervisor and commercial inventory audit pass;
- current cart/checkout/order submission and tracking flows remain reachable;
- no P0 production regression is introduced.

## Rollback

Rollback reference before this remediation: `65a3da3e83c058553335ee0a358c0a4796b890c1`, with permanent older production rollback controls already documented. Roll back this truth-remediation release if checkout/order creation breaks, canonical production health fails, a P0 monitor incident appears, or the change materially reduces factual accuracy. Do not roll back merely to restore unsupported marketing assertions; correct the regression while preserving evidence-safe wording.
