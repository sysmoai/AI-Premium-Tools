# AIPT provider and commercial evidence policy

Status: ACTIVE governance policy  
Owner: @sysmoai  
Last reviewed: 2026-09-03

## Purpose

AIPT must never infer resale rights, account-sharing permission, provider authorization, or an approved commercial seat merely because a provider product exists in the catalog. Commercial classification is evidence-driven and fail-closed.

## Allowed states

- `CUSTOMER_OWNED`: the customer owns/controls the provider account or entitlement and AIPT is supplying a permitted procurement/activation/support service. Current evidence must identify the entitlement model.
- `AUTHORIZED_SEAT`: AIPT has current evidence for the specific provider/SKU that the offered seat, workspace, redemption, reseller, partner, or team model is authorized.
- `HOLD`: evidence is missing, stale, ambiguous, incomplete, or not specific enough to AIPT. `HOLD` does not mean the SKU is prohibited; it means AIPT has not proved a positive commercial classification.
- `PROHIBITED`: current product-specific evidence establishes that the exact proposed fulfilment model cannot be offered. Do not infer `PROHIBITED` from a provider name alone.

Unknown or unverified evidence always resolves to `HOLD`.

## Evidence required for a positive state

A positive state must have all of the following:

1. provider and exact SKU/fulfilment model;
2. authoritative provider source or signed/otherwise verifiable AIPT-specific agreement;
3. evidence owner;
4. verification date and recheck date;
5. an explanation of why the evidence applies to AIPT's exact fulfilment method;
6. no contradiction with a newer provider policy;
7. no evidence borrowed from AIPS, AITP, SaveOnSub, SYSmoAI, or another portfolio unit.

Generic partner pages, reseller-program existence, screenshots without provenance, customer anecdotes, old invoices, or another business unit's rights do not prove AIPT authorization.

## Registry

`data/aipt-commercial-evidence.json` is the source-controlled evidence registry. Every active production product ID must map to exactly one registry group. The commercial inventory audit compares the registry with authenticated production D1 state and fails if coverage, evidence ownership, source, state, or recheck requirements are missing or inconsistent.

The current default review interval is 30 days. Expired evidence fails the audit until it is rechecked. Material provider-policy changes should trigger an earlier review.

## Provider brand vs AIPT seller identity

Provider product and trademark names identify the third-party service. AIPT is the local seller/support entity. AIPT must not be emitted as the `brand` of a third-party provider product, and the site must not imply endorsement, affiliation, reseller status, or authorization unless the registry contains current AIPT-specific evidence supporting that claim.

## Bundles and AIPT services

A multi-provider bundle cannot receive a positive state merely because one included component is valid. Every included entitlement and the combined fulfilment model must be supportable. AIPT-owned implementation/service packages still require a documented scope and fulfilment record before a positive classification.

## Current disposition

As of 2026-09-03, the authenticated production inventory contains 71 active products and all 71 are `HOLD`. This is intentional fail-closed classification while provider/SKU-specific AIPT evidence is collected. No blanket claim that all 71 are prohibited is made.

## Change control

Any state change must be reviewed with the commercial evidence registry in the same change, must pass the authenticated inventory audit, and must not weaken provider/seller separation or AIPT business-unit isolation.
