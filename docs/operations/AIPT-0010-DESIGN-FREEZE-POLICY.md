# AIPT-0010 - Evidence-Gated Visual Redesign Freeze

Date: 2026-09-03  
Owner: `@sysmoai` / AIPT Admin  
Status: ACTIVE until explicitly superseded by measured CRO/brand governance.

## Purpose

Protect the already-working AIPT storefront from preference-driven redesign while the production/search/measurement baselines are still being established. This is not a freeze on product development. It is a freeze on **major visual/theme churn without evidence**.

## Allowed without a design-decision record

Small, scoped changes may continue when they preserve the existing visual system, including:

- bug fixes;
- accessibility fixes;
- responsive/layout corrections;
- copy/content corrections;
- SEO or structured-data work that does not materially restyle the site;
- conversion fixes that preserve the established theme and are below the automated major-change thresholds;
- security/compliance fixes;
- approved AIPT asset corrections that do not constitute a broad redesign.

All changes remain subject to normal tests and live regression checks.

## Major-redesign detection

`Validate and Deploy AIPT` runs `scripts/aipt-design-freeze-guard.mjs` against the change range. The guard monitors design-sensitive storefront files:

- `artifacts/aipt-store/src/index.css`;
- `artifacts/aipt-store/src/App.tsx`;
- storefront `components/`;
- storefront `pages/`;
- public visual image/SVG/icon assets.

A change is treated as major when any current threshold is crossed:

1. `index.css` churn >= 80 line-equivalents; or
2. >= 5 design-sensitive files **and** >= 200 total changed line-equivalents; or
3. >= 500 total design-sensitive changed line-equivalents; or
4. >= 5 public visual assets changed.

Binary visual assets count conservatively toward churn. Test files do not count as design-sensitive.

These thresholds are a deployment safety heuristic, not a claim that smaller changes are automatically good. They exist to prevent accidental large redesigns from shipping without explicit evidence.

## Evidence-gated exception

A major visual change may proceed only when the same change includes a non-template decision file matching:

`docs/decisions/design/AIPT-DESIGN-*.md`

The record must contain:

- `AIPT-0010`;
- `Owner: @sysmoai`;
- `Decision: PROCEED`;
- one approved `Evidence class:` value: `BRAND`, `CRO`, `ACCESSIBILITY`, `SECURITY`, or `COMPLIANCE`;
- `## Evidence`;
- `## Hypothesis`;
- `## Scope`;
- `## Acceptance`;
- `## Rollback`.

Preference, novelty, competitor imitation, or subjective "looks better" reasoning is not sufficient evidence.

## Evidence classes

- **BRAND** - approved AIPT identity/brand correction backed by canonical brand evidence.
- **CRO** - measured funnel/session/order evidence supports a specific experiment or correction.
- **ACCESSIBILITY** - verified accessibility problem requires material visual/system changes.
- **SECURITY** - material security risk requires UI/system changes.
- **COMPLIANCE** - legal/provider/policy truth requires a material presentation change.

## Rollback requirement

Every major-design decision must identify a rollback reference and measurable failure condition. Existing production rollback and backup controls remain authoritative.

## Enforcement limits

This guard gates the canonical deployment workflow. It does **not** substitute for GitHub branch protection. Until AIPT-0008 is closed, an administrator with direct repository-write ability could theoretically change the workflow/guard itself. That residual governance risk remains tracked in issue #295 and must not be misrepresented as solved.

## Exit condition

The freeze may be revised only after:

1. the measurement baseline is reliable enough to evaluate UX/CRO outcomes; and
2. a specific redesign hypothesis has baseline, success metric, guardrail metric and rollback criteria; or
3. a verified BRAND/ACCESSIBILITY/SECURITY/COMPLIANCE requirement justifies the change.

## Acceptance

AIPT-0010 is PASS when the policy is canonical, the deploy validation runs the automated guard, a decision template exists, PR authors are prompted about the freeze, and production verification remains green without changing the current storefront appearance.
