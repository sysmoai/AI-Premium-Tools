# AIPT-0003 — Production Data Backup & Recovery Baseline

Status: implementation candidate / verification required before merge  
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
- The SQL file is uploaded directly to private R2 under:
  `snapshots/<timestamp>/d1/aipt-db.sql`
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

Immutable media objects live below:

`media/objects/<content-identity>/<original-key>`

This means unchanged media is stored once even though many daily manifests can reference it.

## 6. Snapshot manifest

Each successful run creates a PRIVATE manifest:

`snapshots/<timestamp>/manifest.json`

The manifest contains:

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

A backup should also be run manually immediately before any high-risk production action, including:

- D1 schema migration
- bulk catalog update
- order/customer data migration
- destructive admin operation
- payment-state migration
- media bulk replacement/deletion
- emergency rollback or restore

## 8. Retention

Initial policy: NO automatic backup deletion.

Reason: the system is being established for the first time, and deleting recovery points before a full recovery drill would create unnecessary risk. D1 SQL snapshots are expected to be comparatively small, while R2 media is deduplicated by immutable content identity.

After at least 30 days of successful backups and one tested recovery drill, establish an explicit lifecycle policy such as daily/weekly/monthly tiers. Any lifecycle rule must be reviewed separately and must never delete the last known-good recovery snapshot or immutable media object still referenced by a retained manifest.

## 9. Recovery policy — human approval required

There is intentionally NO automated restore workflow in AIPT-0003.

Restoration is destructive and must require an explicit incident decision.

### 9.1 Before any restore

1. Declare incident scope and reason.
2. Record current production commit and current D1 schema health.
3. Run a fresh emergency backup of the current state, even if it is damaged.
4. Select the exact recovery timestamp/manifest.
5. Verify its D1 SQL SHA-256.
6. Verify all required media mirror references exist.
7. Decide whether Time Travel or SQL-based recovery is appropriate.
8. Obtain explicit owner approval for production mutation.

### 9.2 D1 Time Travel recovery

Preferred for a recent accidental data change when the desired point is still inside Cloudflare's available Time Travel window.

Use the timestamp/bookmark from the private manifest. The restore command must be run only after the pre-restore backup above.

Conceptual command:

`pnpm exec wrangler d1 time-travel restore aipt-db --bookmark=<PRIVATE_BOOKMARK>`

Do not copy a private bookmark into a public issue or PR.

Cloudflare Time Travel restore overwrites the database in place. Treat it as destructive.

### 9.3 SQL recovery

Use a stored SQL snapshot when:

- the required recovery point is outside the Time Travel window,
- a portable recovery copy is required,
- or the recovery should first be tested away from production.

Preferred procedure:

1. Download the selected private SQL snapshot to an approved secure environment.
2. Verify SHA-256 against the private manifest.
3. Create/use a temporary recovery D1 database when technically feasible.
4. Import the SQL snapshot into the recovery database.
5. Validate table counts, product/catalog state, orders, customers, reviews, media relationships and schema version.
6. Only then plan the controlled production restoration.

Never blindly execute an old SQL dump against production without a recovery plan and validation.

### 9.4 R2 media recovery

For each source object required by the selected manifest:

1. Read its `backup_key` and metadata from the private manifest.
2. Retrieve the immutable object from `aipt-backups`.
3. Restore it to the original key in `aipt-media`.
4. Reapply required HTTP metadata/content type from the manifest.
5. Verify byte size/content identity and public `/media/<key>` delivery.

Do not delete the backup copy after restoration.

## 10. Post-recovery verification gate

A recovery is incomplete until all of these pass:

- `/api/healthz` -> 200 / `status=ok`
- `/api/db-schema` -> expected verified migration
- `/api/products` -> non-empty valid catalog
- representative product detail -> 200
- representative product media -> 200 and correct bytes/content type
- checkout route loads
- order tracking route loads
- unauthenticated admin APIs remain 401
- homepage/products/cart/checkout/policy routes pass production monitor
- `robots.txt`, `sitemap.xml`, `llms.txt`, manifest remain reachable
- D1 data counts are plausible against the selected recovery snapshot
- no accidental canonical/SEO regression

Then run a NEW backup so the recovered state becomes a new recovery point.

## 11. Backup failure policy

A failed backup must never delete or mutate existing backups.

If a run fails:

- production storefront remains untouched;
- retain all previous snapshots/mirror objects;
- inspect only the failure class (auth, D1 export, R2 API, object-copy mismatch, identity mismatch);
- never weaken identity or checksum gates merely to make the workflow green;
- fix the backup pipeline before proceeding with high-risk production migrations.

## 12. Required Cloudflare token capability

The workflow uses the existing GitHub Cloudflare credentials without printing them. The token must have the minimum permissions necessary to:

- inspect/export D1 `aipt-db` and retrieve Time Travel information;
- read production R2 `aipt-media` objects/inventory;
- create/read/write private R2 `aipt-backups`.

Creating an R2 bucket requires Workers R2 Storage Write permission. If the current token does not have the required least-privilege permissions, the workflow should fail closed and the token scope should be adjusted deliberately rather than replaced with a broad Global API Key.

## 13. AIPT-0003 acceptance criteria

PASS only when a real run proves all of the following:

- correct production D1 identity verified
- D1 backend is `production`
- Time Travel bookmark captured privately
- full D1 SQL export created
- D1 SQL SHA-256 calculated
- private `aipt-backups` bucket exists
- SQL snapshot uploaded privately
- all current `aipt-media` objects inventoried
- every current media object has an immutable backup reference
- private manifest uploaded
- snapshot objects verified after upload
- no backup payload appears in GitHub artifacts/logs/repository
- live storefront/data are not mutated by the backup operation

Until the real workflow run passes, this step is `IMPLEMENTED / NOT VERIFIED`, not `COMPLETE`.

## 14. Official technical references checked for this design

Cloudflare D1 Time Travel and backups: https://developers.cloudflare.com/d1/reference/time-travel/  
Cloudflare D1 import/export: https://developers.cloudflare.com/d1/best-practices/import-export-data/  
Cloudflare D1 Wrangler commands: https://developers.cloudflare.com/d1/wrangler-commands/  
Cloudflare R2 API: https://developers.cloudflare.com/r2/api/  
Cloudflare R2 object API: https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/  
Cloudflare R2 bucket creation: https://developers.cloudflare.com/r2/buckets/create-buckets/
