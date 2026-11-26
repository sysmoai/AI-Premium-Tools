# AIPT-0003 — Production Data Backup & Recovery Baseline

Status: IMPLEMENTED — real production verification required before completion  
Created: 2026-09-03 (Asia/Dhaka)  
Canonical production: https://aipremium.tools  
Source rollback anchor: `rollback/aipt-production-baseline-2026-09-03`  
Source baseline SHA: `28da818cd1682cd617d4420bb98925a502dbe759`

## Objective

Protect production state that Git source rollback cannot restore, without placing customer/order data, provider credentials, plaintext database rows or private recovery material in the public GitHub repository.

Covered sources:

- Cloudflare D1 production binding `DB` / database `aipt-db`
- Cloudflare R2 production binding `MEDIA` / bucket `aipt-media`
- D1 schema definitions and all user-table rows
- every R2 object outside the reserved backup namespace

## Final architecture

AIPT-0003 does **not** require a broad Cloudflare management API token.

GitHub Actions obtains a short-lived signed OIDC token from GitHub and POSTs it to:

`https://aipremium.tools/internal/aipt-backup`

The Cloudflare Pages Function verifies the GitHub JWT signature and exact identity claims before doing any work. After authentication it reads production data only through the Pages Function's existing `DB` and `MEDIA` bindings.

The backup endpoint never exposes plaintext backup content to GitHub Actions. It encrypts payloads inside Cloudflare before writing them to R2.

## Authentication controls

The endpoint requires:

- issuer: `https://token.actions.githubusercontent.com`
- audience: `aipt-production-backup`
- repository: `sysmoai/AI-Premium-Tools`
- immutable repository ID: `1239441399`
- workflow identity: `.github/workflows/aipt-production-backup.yml`
- accepted production ref: `refs/heads/main`
- accepted production events: `schedule`, `workflow_dispatch`, `workflow_run`

JWT signatures are verified against GitHub's live OIDC JWKS using RS256.

Pull-request refs are accepted only for controlled same-repository verification of the endpoint logic; production scheduled backups run from `main`.

## Encryption

AIPT uses envelope encryption for every sensitive payload:

1. Generate a fresh AES-256-GCM key.
2. Generate a random 12-byte IV.
3. Encrypt the payload with AES-GCM.
4. Wrap the AES key with the AIPT RSA-4096 recovery public key using RSA-OAEP SHA-256.
5. Store only the encrypted envelope in R2.

Recovery public-key fingerprint:

`8b34ab2a3e75e7adcbf3801a8c7fdda3d599d7e2b7737b83da62893139a31598`

The private key is **not** in Git, GitHub Actions secrets, Cloudflare configuration or application code. It is held in the owner's connected Google Drive recovery vault:

`AIPT Recovery Vault — Backup Private Key — 2026-09-03`

Never copy that private key into a GitHub issue, PR, Cloudflare variable, chat, support ticket or public document.

## D1 backup format

Current AIPT production cannot rely on `D1Database.dump()` as a universal backup primitive. AIPT therefore creates a portable logical snapshot from the runtime binding.

The encrypted database payload contains:

- `sqlite_master` schema definitions
- every non-internal user table
- all rows for every captured table
- per-table row counts
- total row count
- capture timestamp

The plaintext JSON is SHA-256 hashed before encryption. The hash and non-sensitive counts are returned in the workflow summary; the rows themselves never leave the encrypted backup payload.

The endpoint fails closed if the database snapshot exceeds configured row/byte safety limits rather than silently producing a partial backup.

## D1 Time Travel

Cloudflare D1 Time Travel remains an additional recovery layer supplied by Cloudflare. AIPT-0003 does not falsely claim to capture a Time Travel bookmark because the runtime D1 binding does not expose that management-plane operation and the existing deployment token is intentionally not broadened.

For a recent incident, operators may use Cloudflare's D1 Time Travel from the authorized Cloudflare control plane. For durable recovery outside that window, use the encrypted logical snapshots described here.

## R2 media backup

The endpoint enumerates the full `MEDIA` bucket while excluding the reserved prefix:

`_aipt-backups/`

Each source object receives an immutable source identity derived from its key, ETag and size. Its encrypted backup is stored under a content-addressed key:

`_aipt-backups/media/<source-identity>.enc`

If that encrypted object already exists, later snapshots reuse it. Unchanged media is therefore not recopied every day.

The private encrypted manifest records the original object key, byte size, ETag, upload time, HTTP metadata, custom metadata, backup key and source identity required for restoration.

## Snapshot structure

Each backup creates:

`_aipt-backups/<timestamp>/database.json.enc`  
`_aipt-backups/<timestamp>/manifest.json.enc`

Reusable encrypted media objects live below:

`_aipt-backups/media/<source-identity>.enc`

The manifest itself is encrypted and contains the recovery map.

## Public-access firewall

`functions/media/[[key]].ts` explicitly returns HTTP 404 for every R2 key beginning with `_aipt-backups/`.

This gives two independent controls:

1. backup payloads are strongly encrypted;
2. the normal public media delivery route refuses to serve the backup namespace.

## Automation cadence

Workflow: `.github/workflows/aipt-production-backup.yml`

Triggers:

- after a successful `Validate and Deploy AIPT` workflow
- every day at 21:17 UTC
- explicit `workflow_dispatch`

The job requests a short-lived GitHub OIDC token and calls the production backup endpoint. No long-lived Cloudflare backup token is used.

## Workflow acceptance checks

A backup run must prove all of the following:

- endpoint authenticated the GitHub OIDC identity
- encrypted D1 snapshot exists and is re-read with matching byte size
- D1 snapshot has at least one table and row
- D1 plaintext SHA-256 is produced before encryption
- all source R2 objects are accounted for as either new encrypted copies or reused encrypted copies
- encrypted private manifest exists and is re-read with matching byte size
- recovery public-key fingerprint matches the approved key
- public `/media/_aipt-backups/...` request returns 404
- no plaintext database rows or media object keys are emitted into GitHub artifacts

AIPT-0003 is COMPLETE only after a real post-deployment production run passes these checks.

## Recovery policy — explicit human approval required

There is deliberately no automated restore path. Restoration mutates production and must be treated as an incident operation.

Before restore:

1. record the incident and current production commit;
2. capture a fresh backup of the current state when possible;
3. select the exact encrypted snapshot;
4. retrieve the private recovery key from the Drive recovery vault;
5. decrypt in an approved secure environment;
6. verify SHA-256 and object counts against the manifest;
7. restore into a non-production recovery database/bucket first when technically feasible;
8. validate catalog, orders, customers, reviews, media relationships and schema;
9. obtain explicit owner approval before any production mutation.

## Envelope decryption format

Every encrypted payload has this binary structure:

- 8 bytes magic: `AIPTBK01`
- 2 bytes big-endian wrapped-key length
- RSA-OAEP wrapped AES key
- 12-byte AES-GCM IV
- AES-GCM ciphertext/tag

Recovery software must reject an unexpected magic/version or invalid authentication tag.

## Post-recovery verification

After any recovery, require:

- `/api/healthz` healthy
- `/api/db-schema` expected migration
- `/api/products` non-empty and plausible
- representative product detail/media healthy
- cart/checkout/order tracking routes load
- unauthenticated admin APIs remain rejected
- homepage/products/policy routes pass production monitor
- robots/sitemap/manifest remain healthy
- no canonical/indexing regression

Then immediately create a fresh encrypted backup of the recovered state.

## Security history

Earlier AIPT-0003 experiments proved the existing Cloudflare deploy token has insufficient D1/R2 management permissions. The system deliberately did **not** broaden that deployment credential. Instead, AIPT moved to GitHub OIDC + runtime D1/R2 bindings, eliminating the manual backup-token dependency and reducing long-lived credential exposure.
