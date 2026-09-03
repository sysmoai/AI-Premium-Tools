# AIPT-0009 - 90-Day GitHub Execution Structure

Date: 2026-09-03  
Owner: `sysmoai` / AIPT Admin  
Canonical system: `docs/AIPT_MASTER_SYSTEM.md`

## Objective

Make the dated AIPT 90-day roadmap operational in GitHub without changing storefront, commerce, SEO runtime, D1, R2, or production URL behavior.

## Live issue structure

| Wave | GitHub issue | Focus |
|---|---:|---|
| 0 | #284 | Protect & baseline |
| 1 | #285 | Brand + commercial truth |
| 2 | #286 | Technical SEO |
| 3 | #287 | Measurement |
| 4 | #288 | Catalog + media |
| 5 | #289 | Content / authority engine |
| 6 | #290 | Commerce automation |
| 7 | #291 | CRM + customer lifecycle |
| 8 | #292 | Security + accessibility + performance |
| 9 | #293 | Control Center + automation |

Dedicated blockers:

- #294 - AIPT-0005 authenticated Search Console baseline export.
- #295 - AIPT-0008 GitHub control-plane protections.

Existing rolling production SEO audit:

- #20 - `[audit] AIPT organic growth and SEO backlog`; retained as the automated live P0/P1/P2 source and attached to Wave 2 rather than duplicated.

## Milestone and labels

Workflow `.github/workflows/aipt-roadmap-governance.yml` applies the idempotent control script `scripts/aipt-roadmap-governance.mjs` on `main`.

Target milestone:

- `AIPT 90-Day Execution - Sep 3-Dec 5, 2026`
- Due: 2026-12-05 end-of-day Asia/Dhaka (`2026-12-05T17:59:59Z`)

Target labels:

- `aipt-wave-0` through `aipt-wave-9`
- `roadmap`, `blocked`, `priority-p0`, `priority-p1`
- `governance`, `brand-truth`, `seo`, `measurement`, `catalog-media`, `content`, `commerce`, `lifecycle`, `security`, `automation`

The apply job is restricted to `refs/heads/main` and receives only `contents: read` + `issues: write`. It cannot administer repository visibility, branch protection, rulesets, Actions policy, or secrets.

## Ownership and acceptance

All roadmap/blocker issues are assigned to `@sysmoai`. Each wave issue records the exact AIPT task IDs and acceptance tests from the master roadmap. Blocked items remain explicitly open until external evidence/control-plane access satisfies their acceptance criteria.

## P0/P1 import rule

Issue #20 remains the automated source for current SEO findings. AIPT-0009 attaches it to the 90-day milestone with Wave 2 / P1 / SEO classification while preserving its automation-maintained body.

## Safety

- No production application code is changed by the roadmap bootstrap.
- Existing issue bodies/labels are preserved; desired labels are unioned rather than destructive replacement.
- Existing milestone is reconciled by exact title instead of duplicated.
- The script refuses mutation outside `sysmoai/AI-Premium-Tools` or from a non-`main` ref.
- No secret value is stored or logged.

## Acceptance

AIPT-0009 is PASS when:

1. the milestone exists and is open with the correct due date;
2. all controlled labels exist;
3. issues #20 and #284-#295 are attached to the milestone with their required labels;
4. `@sysmoai` ownership is present;
5. workflow validation and post-merge application succeed.
