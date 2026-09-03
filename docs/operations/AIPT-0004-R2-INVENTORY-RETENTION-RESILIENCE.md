# AIPT-0004 — R2 Inventory, Retention & Independent Recovery Resilience

Status: IMPLEMENTED — production verification pending  
Created: 2026-09-03 (Asia/Dhaka)  
Canonical production: https://aipremium.tools  
Source bucket: `aipt-media`

## Objective

Establish a durable inventory and recovery policy for AIPT production media and encrypted backups without changing customer-facing media URLs, product behavior, checkout, or the production data model.

AIPT-0003 already established encrypted D1 logical snapshots and encrypted content-addressed R2 media copies under the private `_aipt-backups/` namespace. AIPT-0004 adds an independent-provider recovery layer and formal retention expectations.

## Current R2 roles

The `aipt-media` R2 bucket contains two logically separated classes of objects:

1. **Production media** — normal application objects served through `/media/...`.
2. **Encrypted recovery objects** — objects under `_aipt-backups/`.

The public media function rejects `_aipt-backups/` with HTTP 404. Backup payloads use per-payload AES-256-GCM keys wrapped by the AIPT RSA-OAEP-SHA256 recovery public key. The corresponding private key is stored outside GitHub and Cloudflare in the owner's private Google Drive recovery vault.

## Inventory contract

Every successful production backup must prove:

- all normal R2 source objects are enumerated;
- every source object is represented by a new or reusable content-addressed encrypted copy;
- D1 snapshot and private recovery manifest are encrypted and written;
- the encrypted backup corpus can be independently enumerated through a GitHub-OIDC-only internal export endpoint;
- every exported ciphertext object is downloaded with its expected byte length;
- a SHA-256 checksum file is generated over the downloaded encrypted objects;
- no plaintext database rows, customer data, payment data, original media bytes, or private recovery key are uploaded to GitHub artifacts.

## Independent-provider recovery layer

The production backup workflow creates a second-provider copy using GitHub Actions artifacts:

- artifact content: ciphertext only;
- artifact format: encrypted R2 objects + restore index + SHA-256 checksums;
- artifact retention: **7 days**;
- compression: disabled because encrypted ciphertext is effectively incompressible;
- authentication to Cloudflare: no long-lived Cloudflare API key; GitHub obtains a short-lived OIDC identity;
- export endpoint permits only the canonical `main` backup workflow and only encrypted `_aipt-backups/` objects.

This means a recent encrypted recovery set survives a Cloudflare-account or R2-bucket-level loss for the rolling artifact window.

The first verified production offsite artifact is additionally copied to the owner's private Google Drive folder `AIPT Recovery Vault` as a durable baseline. That Drive copy is not automatically deleted.

## Retention policy

### Production media

Retain while referenced by the live catalog, historical orders, documentation, or another operational/legal requirement. No automatic deletion is enabled in AIPT-0004.

### Content-addressed encrypted media backups

Retain indefinitely for now. These objects are deduplicated by source identity, so unchanged media is not copied every day. Automatic garbage collection is deliberately disabled until a future recovery-aware process can prove that an encrypted media object is no longer referenced by any retained recovery manifest.

### Encrypted D1 snapshot + manifest objects in R2

Keep the current rolling encrypted snapshots. A future lifecycle rule may prune old snapshot-level database/manifest objects after recovery requirements are approved, but AIPT-0004 does not introduce destructive cleanup.

### GitHub encrypted offsite artifacts

Retain for **7 days**. A daily scheduled backup continuously refreshes this independent-provider recovery window.

### Google Drive recovery vault

Keep the baseline artifact and private recovery key until explicitly superseded and independently verified. Never place the private recovery key inside the backup ZIP itself.

## Security boundaries

- Public repository: allowed to contain only the recovery **public** key and implementation code.
- GitHub Actions: receives short-lived OIDC identity; no Cloudflare backup API token is required.
- GitHub artifact: encrypted ciphertext only; safe even if downloaded by an unauthorized third party, assuming the private recovery key remains private.
- Google Drive: contains the private recovery key and durable encrypted baseline under the owner's private account.
- Cloudflare: stores production source data plus encrypted in-provider recovery copies.

## Recovery order

1. Stop production writes and record the incident.
2. Select the intended recovery point.
3. Prefer an intact Cloudflare encrypted snapshot when available.
4. If Cloudflare recovery objects are unavailable, obtain the matching encrypted GitHub/Drive offsite bundle.
5. Retrieve the private key from `AIPT Recovery Vault` only on an isolated trusted recovery workstation.
6. Verify `SHA256SUMS` before decryption.
7. Decrypt `manifest.json.enc` first to reconstruct original media mappings.
8. Decrypt and validate the D1 logical snapshot before any production import.
9. Restore into staging/new resources first.
10. Run application, schema, media, commerce and health checks.
11. Require explicit human approval before any production cutover.

## Acceptance gate

AIPT-0004 is PASS only when all of the following are verified in production:

- normal deployment validation remains green;
- production backup remains green;
- encrypted export endpoint accepts canonical GitHub OIDC and rejects public access;
- encrypted offsite artifact is created successfully;
- artifact contains restore index, SHA-256 checksums and the complete encrypted backup corpus;
- first verified artifact is copied to private Google Drive `AIPT Recovery Vault`;
- Continuous Production Monitor and Commerce/Data Integrity Watch remain green;
- no plaintext sensitive backup payload appears in GitHub logs/artifacts;
- storefront/media behavior is unchanged.

## Rollback

If AIPT-0004 causes a production regression, revert its source commit. Existing AIPT-0003 encrypted recovery objects remain valid. Do not delete recovery objects during rollback.

## External platform notes

Cloudflare R2 supports lifecycle and bucket-lock controls. Those controls may be added later through Cloudflare's control plane after retention durations and cost implications are approved. They are intentionally not guessed or silently enabled here.

GitHub Actions artifact retention is used as a short independent-provider recovery window, not as the only long-term archive.
