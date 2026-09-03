# AIPT-0008 — GitHub Governance & Security Audit

**Audit date:** 2026-09-03 (Asia/Dhaka)  
**Repository:** `sysmoai/AI-Premium-Tools`  
**Canonical branch:** `main`  
**Production domain:** `https://aipremium.tools`  
**Scope:** repository visibility, branch/ruleset protection, GitHub Actions permissions/supply-chain controls, and secret governance.

## Status

**PARTIAL — source-controlled hardening implemented; GitHub control-plane protection remains blocked by the connected tool surface.**

AIPT-0008 must not be marked COMPLETE while `main` remains unprotected and repository visibility remains an unresolved control-plane decision.

## Verified control-plane state

At audit time:

- repository visibility: **PUBLIC**;
- repository owner: `sysmoai`;
- default branch: `main`;
- connected GitHub identity has repository admin permission;
- `main` branch protection: **disabled**;
- repository rulesets: **none**;
- repository has GitHub Pages enabled;
- repository allows squash, merge-commit and rebase merges;
- auto-merge is disabled;
- branch auto-delete after merge is disabled;
- web commit signoff is not required.

The connected GitHub surface permits branch/ruleset reads but does not expose mutations for branch protection, repository rulesets, repository visibility, Actions policy, or secret administration. These settings cannot be truthfully claimed as remediated from this session.

## Source-controlled remediation implemented in this task

### 1. Production deployment token least privilege

`.github/workflows/deploy.yml` now explicitly sets:

```yaml
permissions:
  contents: read
```

The deploy workflow does not require repository write permissions. Cloudflare authentication remains isolated to the production deploy job through dedicated repository secrets.

### 2. Main-only production deployment gate

The production deploy job now requires the workflow ref to be exactly `refs/heads/main` for both push and manual dispatch.

This closes the prior path where an authorized user could manually dispatch the production workflow from a feature branch and cause unmerged branch code to enter the production deploy job.

Pull-request runs remain validation-only and do not enter the production deployment job.

### 3. Checkout credential persistence disabled

All workflows in this repository that use `actions/checkout` now set:

```yaml
persist-credentials: false
```

These workflows do not push Git changes, so leaving `GITHUB_TOKEN` persisted in local git configuration is unnecessary.

### 4. Third-party/official actions pinned immutably

The currently used action versions were resolved to their verified current `v4` commit targets and pinned by full commit SHA:

- `actions/checkout` → `11d5960a326750d5838078e36cf38b85af677262`
- `actions/setup-node` → `49933ea5288caeca8642d1e84afbd3f7d6820020`
- `pnpm/action-setup` → `b906affcce14559ad1aafd4ab0e942779e9f58b1`
- `actions/upload-artifact` → `ea165f8d65b6e75b540449e92b4886f43607fa02`

This prevents a later movement of a major-version tag from silently changing production CI behavior.

Action upgrades must now be deliberate PRs that update both the SHA and the human-readable version comment after upstream verification.

### 5. Cloudflare local-secret files ignored

`.gitignore` now excludes:

- `.dev.vars`
- `.dev.vars.*`

The existing `.env` / `.env.*` protection remains, with `.env.example` explicitly allowed.

### 6. Secret-hygiene watchdog strengthened

The hourly code/security watchdog now rejects tracked:

- `.env` family secret files other than `.env.example`;
- `.dev.vars` family files;
- `wrangler.toml.secret`;
- unmistakable private-key PEM headers;
- high-confidence common GitHub, Stripe-live, AWS access-key-ID, and Google API-key patterns.

This is a current-tree guard. It does **not** prove that historical credentials were rotated or that every possible secret format can be detected.

## Existing workflow permission inventory

After this remediation, the intended permission model is:

| Workflow | Repository token permissions |
|---|---|
| Validate and Deploy AIPT | `contents: read` |
| AIPT Production Backup | `contents: read`, `id-token: write` |
| Continuous Production Monitor | `contents: read`, `issues: write` |
| Commerce/Data Integrity Watch | `contents: read`, `issues: write` |
| Deep SEO/Content Audit | `contents: read`, `issues: write` |
| Hourly Code/Security Quality Watch | `contents: read`, `issues: write` |
| Automation Supervisor | `contents: read`, `issues: write`, `actions: write` |

The write scopes in watchdogs are used to create/update/close incident issues. The supervisor additionally needs `actions: write` to dispatch stale watchdogs. Backup uses short-lived OIDC identity and does not require a long-lived Cloudflare backup API token.

## Secret governance

### Verified

- production deploy workflow references protected GitHub secret names for Cloudflare deployment;
- secret values are not present in workflow source;
- backup authentication uses GitHub OIDC;
- `.gitignore` covers normal local secret files;
- automated current-tree secret-hygiene checks exist and are strengthened in this task.

### Not verifiable through the connected surface

The connector deliberately does not expose secret values, secret lists, secret scanning alerts, or secret-rotation metadata. Therefore this task does **not** claim:

- every historical exposed credential has been rotated;
- there are zero GitHub secret-scanning alerts;
- repository-level push protection is enabled;
- repository-level Actions default token permissions are configured read-only;
- Actions are restricted to an approved allowlist at repository settings level.

For a public repository, GitHub secret scanning provides an additional platform layer, but alerts/rotation must still be reviewed by an authorized repository administrator.

## Required control-plane remediation for PASS

### A. Protect `main`

Create an active branch ruleset targeting the default branch with at least:

1. **Require a pull request before merging**.
2. **Require the AIPT validation check to pass before merging** (use the actual GitHub Actions `validate` check generated by `Validate and Deploy AIPT`).
3. **Block force pushes**.
4. **Block branch deletion**.
5. **Require conversation resolution before merging**.
6. No routine bypass actor unless an emergency process is explicitly documented.

Because AIPT is currently operated by a single GitHub owner, do not require one approving review until a second trusted maintainer exists; otherwise the owner can deadlock their own PRs. The PR requirement can still prevent direct unreviewed branch writes while status checks enforce validation.

### B. Repository visibility decision

The repository is currently public and has no license declaration. No verified open-source requirement was established during this audit.

**Recommended default for a commercial production codebase: PRIVATE**, but visibility should only be changed after checking the effect on GitHub Pages, Vercel/GitHub integrations, Actions usage, and any intentional public-code requirement.

If public visibility is intentionally retained, record that decision and accept that repository source, workflow architecture, D1 identifier, historical commits, and non-secret operational metadata are publicly visible.

### C. Repository-level Actions policy

In GitHub repository Actions settings, set the default `GITHUB_TOKEN` permission to **read repository contents** and do not allow Actions to create/approve pull requests unless a future workflow explicitly requires it.

Restrict allowed actions to the smallest practical set. Current AIPT source-controlled actions are GitHub-owned actions plus `pnpm/action-setup`, all pinned to immutable SHAs after this task.

### D. Secret/security settings

Review GitHub Security/Advanced Security settings and alerts. Ensure push protection is enabled where available, review all secret-scanning alerts, and rotate/revoke any historically exposed credential that is not already proven rotated.

Never paste secret values into this audit document, GitHub issues, PR comments, or chat.

## Why CODEOWNERS is not added yet

A sole-maintainer repository gains little enforcement from a CODEOWNERS rule requiring `@sysmoai`, because an author cannot provide an independent approval for their own PR. Add CODEOWNERS when at least one second trusted maintainer is available, then consider requiring code-owner review for security-sensitive paths such as:

- `.github/workflows/**`
- `functions/**`
- `d1/**`
- `wrangler.toml`
- payment/commerce code

## Acceptance gate

AIPT-0008 is PASS only when all of the following are true:

- source-controlled workflow hardening validates green;
- production deploy still works from `main` and remains impossible from PR/non-main manual ref;
- current secret-hygiene watchdog passes;
- backup workflow remains green after action pinning;
- `main` branch protection/ruleset is active;
- repository visibility is explicitly approved as public or changed to private;
- repository-level Actions policy is reviewed/configured;
- secret scanning/push-protection/rotation status is reviewed by an authorized control-plane surface.

Until the last four control-plane items are verified, status remains **PARTIAL / BLOCKED ON GITHUB CONTROL-PLANE SETTINGS**.

## Rollback

If source-controlled hardening unexpectedly breaks CI, revert the AIPT-0008 source commit/PR. Do not weaken production branch/ref gating merely to make manual deployment easier. Any control-plane ruleset rollback must be separately documented because Git rollback cannot restore GitHub repository settings.
