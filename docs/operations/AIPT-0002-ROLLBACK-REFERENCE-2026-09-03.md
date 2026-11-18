# AIPT-0002 — Production Rollback Reference

Status: COMPLETE WITH CONNECTOR LIMITATION
Captured: 2026-09-03 Asia/Dhaka
Repository: sysmoai/AI-Premium-Tools
Canonical production domain: https://aipremium.tools

## Permanent rollback source reference

Rollback branch:
`rollback/aipt-production-baseline-2026-09-03`

Exact source commit:
`28da818cd1682cd617d4420bb98925a502dbe759`

This branch was created directly from the pre-change production baseline commit captured in AIPT-0001. It must not be force-updated or repurposed for development.

## Why this exists

Before SEO, branding, product-media, ecommerce, payment, CRM, analytics, content or infrastructure changes, AIPT needs a simple source-level recovery anchor. If a future release causes a serious regression, maintainers can compare against or branch from this exact commit.

## Important scope boundary

This rollback reference protects the repository source state only. It does not itself snapshot:
- Cloudflare D1 production data
- R2 media objects
- Cloudflare account configuration, DNS, Access, WAF or environment variables
- external payment-provider state
- Search Console / Analytics data

Those require their own backup/control procedures in later AIPT tasks.

## Git tag/release limitation for this execution

The connected GitHub toolset available during AIPT-0002 supports branch, file, PR and ref operations but does not expose an authenticated `create tag` or `create release` operation. The runtime also has no authenticated `gh` CLI.

Therefore AIPT-0002 created the safe equivalent rollback branch now rather than pretending a Git tag exists.

Desired future annotated tag name:
`aipt-production-baseline-2026-09-03`

Desired tag target:
`28da818cd1682cd617d4420bb98925a502dbe759`

When authenticated tag creation is available, create the tag at exactly this SHA and do not move it.

## Recovery use

For investigation:
- compare a failing release against `rollback/aipt-production-baseline-2026-09-03`

For emergency source recovery:
1. do not rewrite `main` blindly;
2. create a recovery branch from the rollback reference;
3. selectively revert or restore the offending changes;
4. run typecheck, tests, build and migration validation;
5. deploy through the normal guarded pipeline;
6. verify immutable Pages deployment and canonical production before declaring recovery.

## Guardrails

- Never force-push this rollback branch.
- Never add normal feature commits to it.
- Never use a source rollback as a substitute for D1/R2 backup.
- Never deploy a rollback without checking whether database migrations or commercial data changed after this baseline.
- Prefer targeted revert over broad history rewrite.

## Verification evidence

The GitHub branch endpoint was checked immediately after creation and confirmed that `rollback/aipt-production-baseline-2026-09-03` points to commit `28da818cd1682cd617d4420bb98925a502dbe759`.

## Acceptance result

PASS for source rollback checkpoint.

Deferred sub-item: create the matching immutable Git tag/release when an authenticated tag/release write action becomes available.

Next execution task should continue the protection wave without changing the storefront behavior.