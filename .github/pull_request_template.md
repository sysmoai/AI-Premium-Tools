## What changed

Describe the smallest intended change and why it is needed.

## Evidence / truth source

List the production evidence, issue, provider/policy source, measurement, or approved AIPT brand source that supports this change.

## AIPT-0010 design freeze

- [ ] This PR does **not** contain a major visual/theme redesign; or
- [ ] This PR contains a major visual change and includes `docs/decisions/design/AIPT-DESIGN-*.md` with `Decision: PROCEED`, an allowed evidence class, acceptance criteria and rollback.

Preference-only redesign is not an accepted rationale while AIPT-0010 is active.

## Regression / acceptance

- [ ] Typecheck/tests/build pass.
- [ ] Checkout/order/search behavior is preserved unless this PR explicitly and safely changes it.
- [ ] SEO/indexing behavior is preserved unless this PR is an approved SEO migration.
- [ ] No secret/sensitive data is added.
- [ ] Rollback is clear for any material production change.
