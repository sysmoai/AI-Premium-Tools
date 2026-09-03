# AIPT-0003 — Production Data Backup & Recovery Baseline

Status: BLOCKED — implementation ready; dedicated backup token required for real verification  
Created: 2026-09-03 (Asia/Dhaka)  
Canonical production: https://aipremium.tools  
Source rollback anchor: `rollback/aipt-production-baseline-2026-09-03`  
Source baseline SHA: `28da818cd1682cd617d4420bb98925a502dbe759`

## 1. Objective

Protect the production data that Git source rollback cannot restore:

- Cloudflare D1 database `aipt-db`
- Cloudflare R2 media bucket `aipt-media`
- the exact D1 point-in-time recovery bookmark associated with each backup run
- a private manifest that maps production R2 objects to immutable backup objects

A backup is not considered valid merely because a command returned zero. The backup runner verifies source identity, D1 backend type, SQL export size/hash, R2 inventory completeness, immutable media mirror references, and snapshot object presence.

## 2. Non-negotiable privacy rule

The GitHub repository is PUBLIC. Production SQL contains customer/order data and may include personal data such as names, phone numbers, email addresses, payment references, notes, reviews, and operational records.

Therefore:

- NEVER upload a D1 dump to a GitHub Actions artifact.
- NEVER commit a D1 dump to Git.
- NEVER print SQL, customer rows, payment references, full R2 object keys, or the full Time Travel bookmark into public logs.
- NEVER put the private backup manifest in the repository.
- Store production backup payloads only in the private Cloudflare R2 backup bucket `aipt-backups`.

GitHub may contain only non-sensitive verification summaries and hashes.

## 3. Current production data sources

### D1

- Name: `aipt-db`
- ID: `9c19dfdb-aead-4bed-b6ff-f6bf379bc296`
- Expected migration: `0002_catalog_media_foundation.sql`
- Production application binding: `DB`

The backup runner refuses to continue if the returned D1 identity differs from the expected database ID or if the D1 backend is not reported as `production`.

### R2 media

- Production bucket: `aipt-media`
- Application binding: `MEDIA`
- Public delivery path: `https://aipremium.tools/media/<key>` through Pages Functions

The backup system does not change or rewrite any object in `aipt-media`.

### Backup destination

- Bucket: `aipt-backups`
- Must remain private.
- Must NOT be attached to a public custom domain.
- Must NOT have an `r2.dev` public endpoint enabled.
- Must NOT be bound to the production storefront unless a future recovery design explicitly requires it.

R2 buckets are private by default; this document treats any future public exposure of `aipt-backups` as a security incident.

## 4. Backup model

### 4.1 D1 — two recovery layers

Layer A — Cloudflare D1 Time Travel:

- Cloudflare provides built-in point-in-time recovery for D1 production storage.
- The runner captures the current Time Travel bookmark on each successful backup.
- The complete bookmark is stored only in the private manifest.
- Public logs contain only a short SHA-256 fingerprint of the bookmark.

Layer B — full SQL export:

- `wrangler d1 export aipt-db --remote` produces a full schema + data SQL snapshot.
- The SQL file is uploaded directly to private R2 under `snapshots/<timestamp>/d1/aipt-db.sql`.
- SHA-256 and byte size are recorded.
- The temporary runner copy is deleted after the job.

The SQL export provides a recovery source beyond the useful Time Travel window and a portable database-level recovery artifact.

## 5. R2 media backup model

Repeatedly copying the entire media bucket every day would multiply storage unnecessarily. AIPT therefore uses an immutable content-addressed mirror.

For every production R2 object:

1. Capture key, size, ETag, last-modified time, storage class, HTTP metadata, and custom metadata into the private snapshot manifest.
2. Derive an immutable backup key from the object ETag/content identity.
3. If that exact immutable backup object already exists, reuse it.
4. If it does not exist, download the production object and copy it once into `aipt-backups`.
5. Verify that every source object in the snapshot has a corresponding backup reference.

Immutable media objects live below `media/objects/<content-identity>/<original-key>`.

This means unchanged media is stored once even though many daily manifests can reference it.

## 6. Snapshot manifest

Each successful run creates a PRIVATE manifest at `snapshots/<timestamp>/manifest.json` containing:

- capture time
- source commit
- D1 name / ID / storage version
- full Time Travel bookmark
- D1 export key, size and SHA-256
- complete R2 source inventory
- R2 HTTP/custom metadata
- immutable backup key for each R2 source object
- R2 inventory SHA-256
- deduplication/copy verification counts

The manifest is the recovery map. It must remain private with the SQL snapshot.

## 7. Automation cadence

Workflow: `.github/workflows/aipt-production-backup.yml`

Planned schedule after merge to the default branch:

- Every day at 21:17 UTC
- Equivalent to approximately 03:17 Asia/Dhaka the following calendar day
- Manual `workflow_dispatch` remains available for pre-change and incident backups

A backup should also run immediately before any high-risk production action such as D1 migration, bulk catalog/customer/order changes, destructive admin actions, media replacement/deletion, or emergency restoration.

## 8. Retention

Initial policy: NO automatic backup deletion.

Reason: the system is being established for the first time, and deleting recovery points before a full recovery drill would create unnecessary risk. D1 SQL snapshots are expected to be comparatively small, while R2 media is deduplicated by immutable content identity.

After at least 30 days of successful backups and one tested recovery drill, establish an explicit reviewed lifecycle policy. It must never delete the last known-good recovery snapshot or an immutable media object still referenced by a retained manifest.

## 9. Recovery policy — human approval required

There is intentionally NO automated restore workflow in AIPT-0003. Restoration is destructive and requires an explicit incident decision.

### 9.1 Before any restore

1. Declare incident scope and reason.
2. Record current production commit and D1 schema health.
3. Run a fresh emergency backup of the current state, even if damaged.
4. Select the exact recovery timestamp/manifest.
5. Verify D1 SQL SHA-256 and media references.
6. Decide whether Time Travel or SQL recovery is appropriate.
7. Obtain explicit owner approval for production mutation.

### 9.2 D1 Time Travel recovery

Preferred for a recent accidental data change within Cloudflare's available Time Travel window. Use the private timestamp/bookmark only after the pre-restore backup.

Conceptual command:

`pnpm exec wrangler d1 time-travel restore aipt-db --bookmark=<PRIVATE_BOOKMARK>`

Do not copy a private bookmark into a public issue or PR. Time Travel restore overwrites the database in place and is therefore destructive.

### 9.3 SQL recovery

Use a stored SQL snapshot when the required recovery point is outside Time Travel, a portable copy is required, or recovery should first be validated away from production.

Preferred procedure:

1. Download the selected private SQL snapshot to an approved secure environment.
2. Verify SHA-256 against the private manifest.
3. Create/use a temporary recovery D1 database when technically feasible.
4. Import the SQL snapshot there first.
5. Validate schema, catalog, orders, customers, reviews and media relationships.
6. Only then plan controlled production restoration.

Never blindly execute an old SQL dump against production.

### 9.4 R2 media recovery

For each source object in the selected manifest, retrieve its immutable `backup_key`, restore to the original `aipt-media` key, reapply required HTTP metadata/content type, and verify byte size/content identity and public delivery. Never delete the backup copy after restoration.

## 10. Post-recovery verification gate

A recovery is incomplete until production health, D1 schema, catalog, representative product/media, checkout, tracking, admin 401 gates, public routes, robots/sitemap/llms/manifest, plausible D1 counts and canonical SEO checks pass. After validation, create a NEW backup of the recovered state.

## 11. Backup failure policy

A failed backup must never delete or mutate existing backups or production data. Preserve prior snapshots, inspect the failure class, and never weaken identity/checksum gates just to make the workflow green.

## 12. Dedicated Cloudflare backup credential

Do NOT broaden or reuse the production deployment token silently. The backup workflow now requires a separate GitHub Actions secret:

`CLOUDFLARE_BACKUP_API_TOKEN`

The dedicated Cloudflare custom token should be scoped to the correct AIPT Cloudflare account and contain only the permissions necessary for this backup workflow:

- Account -> D1 -> Read
- Account -> Workers R2 Storage -> Edit / Write

`Workers R2 Storage Edit/Write` is required because the job must create/inspect the private backup bucket and read/write/list R2 objects. The existing `CLOUDFLARE_API_TOKEN` was tested on 2026-09-03 and Cloudflare returned HTTP 403 for R2 management, so it is intentionally no longer used by this backup workflow.

Keep the existing `CLOUDFLARE_ACCOUNT_ID` secret unchanged.

Never use a Global API Key for this workflow.

## 13. Verified blocker from first real run

PR #276 launched the real same-repository backup job on 2026-09-03. Results:

- GitHub/Cloudflare secret presence gate: PASS
- dependency/runtime setup: PASS
- R2 backup-bucket inspection using existing deploy token: FAIL CLOSED with Cloudflare HTTP 403 / Authentication error
- production mutation: NONE
- sensitive data exposure: NONE

Resolution: create the dedicated token above and save it as GitHub Actions secret `CLOUDFLARE_BACKUP_API_TOKEN`, then re-run PR #276. Do not mark AIPT-0003 complete before that real run passes.

## 14. AIPT-0003 acceptance criteria

PASS only when a real run proves:

- correct production D1 identity verified
- D1 backend is `production`
- Time Travel bookmark captured privately
- full D1 SQL export created and hashed
- private `aipt-backups` bucket exists
- SQL snapshot uploaded privately
- all current `aipt-media` objects inventoried
- every current media object has an immutable backup reference
- private manifest uploaded and verified
- no backup payload appears in GitHub artifacts/logs/repository
- live storefront/data remain unmodified by backup operations

Until the real workflow run passes, this step remains `BLOCKED`, not `COMPLETE`.

## 15. Official technical references checked for this design

Cloudflare D1 Time Travel and backups: https://developers.cloudflare.com/d1/reference/time-travel/  
Cloudflare D1 import/export: https://developers.cloudflare.com/d1/best-practices/import-export-data/  
Cloudflare D1 Wrangler commands: https://developers.cloudflare.com/d1/wrangler-commands/  
Cloudflare API token permissions: https://developers.cloudflare.com/fundamentals/api/reference/permissions/  
Cloudflare R2 authentication: https://developers.cloudflare.com/r2/api/tokens/  
Cloudflare R2 API: https://developers.cloudflare.com/r2/api/  
Cloudflare R2 object API: https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/  
Cloudflare R2 bucket creation: https://developers.cloudflare.com/r2/buckets/create-buckets/
