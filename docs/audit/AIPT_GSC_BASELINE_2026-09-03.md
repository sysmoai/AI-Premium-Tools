# AIPT-0005 — Google Search Console Baseline

**Status:** PARTIAL — AUTHENTICATED GSC REPORT EXPORT STILL REQUIRED  
**Date:** 2026-09-03 (Asia/Dhaka)  
**Verified property:** `aipremium.tools` — **Domain property**  
**Canonical production host:** `https://aipremium.tools`  
**Production source SHA at start:** `8dddbb8eeb8aa9f3d98a4ecdf3cf99b1afd57461`

## 1. Objective

Capture the pre-growth Google Search Console baseline before technical SEO, URL, metadata, content, schema, sitemap, CRO, or indexing changes are made.

Required baseline dimensions:

1. Google Search Performance — last 90 complete days.
2. Google Search Performance — last 28 complete days.
3. Queries for both periods.
4. Pages for both periods.
5. Page indexing summary and exclusion/error reasons.
6. Core Web Vitals summary for mobile and desktop.
7. Sitemap/Search Console property state sufficient to interpret the data.

This step is measurement-only. It must not change production SEO behavior.

## 2. Search Console Property Evidence

Connected Gmail contains direct transactional messages from the Google Search Console Team for `aipremium.tools`.

Verified facts:

- Google confirmed the site was recently verified as a **Domain property** in Search Console in an email received on 2026-08-05.
- Google confirmed that Search Console started collecting Google Search impressions for `aipremium.tools` on **2026-08-06**.
- Therefore the requested 90-day baseline does not represent 90 days of pre-existing Search Console history. For this property, available Search Console performance history begins on 2026-08-06.
- A Search Console achievement message dated **2026-08-31** states that `aipremium.tools` reached **40 clicks from Google Search in the past 28 days**.
- That 40-click milestone is a verified adjacent Search Console signal, but it is **not substituted** for the exact frozen 28-day export below because its underlying range does not exactly match the frozen 2026-08-06 through 2026-09-02 window.

## 3. Frozen Date Windows

To avoid mixing incomplete/preliminary current-day data into the baseline, use completed calendar days only.

| Window | Start | End | Notes |
|---|---|---|---|
| 28 complete days | 2026-08-06 | 2026-09-02 | Primary short-term baseline; begins on first confirmed GSC impression-collection date |
| 90 complete days | 2026-06-05 | 2026-09-02 | Requested trend window; actual GSC history begins 2026-08-06 |

If Search Console later shows that the newest complete data date is earlier than 2026-09-02, preserve the same period lengths ending on the newest complete Search Console date and record the adjusted dates explicitly.

## 4. Required Performance Export

For each date window, export Google Search Console **Search results** performance with Web search selected and no query/page filters unless explicitly noted.

Record the property-level totals:

- Clicks
- Impressions
- CTR
- Average position

Export at minimum these table dimensions:

### 4.1 Queries

Columns required:

- Query
- Clicks
- Impressions
- CTR
- Position

### 4.2 Pages

Columns required:

- Page
- Clicks
- Impressions
- CTR
- Position

Preserve the raw exports. Do not manually delete zero rows or normalize URLs before storing the source copy.

## 5. Baseline Metrics — 28 Complete Days

**Frozen window:** 2026-08-06 through 2026-09-02

| Metric | Value |
|---|---:|
| Clicks | EXACT FROZEN-WINDOW TOTAL NOT CAPTURED |
| Impressions | NOT CAPTURED |
| CTR | NOT CAPTURED |
| Average position | NOT CAPTURED |
| Query rows exported | NOT CAPTURED |
| Page rows exported | NOT CAPTURED |

**Verified adjacent milestone:** Search Console reported **40 clicks in the past 28 days as of 2026-08-31**. Keep this as supporting evidence only, not the final frozen-window total.

### Top queries

NOT CAPTURED — do not infer from public search results.

### Top pages

NOT CAPTURED — do not infer from sitemap, crawler visibility, or public search snippets.

## 6. Baseline Metrics — 90 Complete Days

**Requested window:** 2026-06-05 through 2026-09-02  
**Known data-history limitation:** Search Console impression collection began 2026-08-06.

| Metric | Value |
|---|---:|
| Clicks | NOT CAPTURED |
| Impressions | NOT CAPTURED |
| CTR | NOT CAPTURED |
| Average position | NOT CAPTURED |
| Query rows exported | NOT CAPTURED |
| Page rows exported | NOT CAPTURED |

### Top queries

NOT CAPTURED — do not infer from public search results.

### Top pages

NOT CAPTURED — do not infer from sitemap, crawler visibility, or public search snippets.

## 7. Page Indexing Baseline

Exact indexed/not-indexed totals and URL counts still require the authenticated Search Console Page indexing report. However, Search Console transactional alerts provide verified issue-category evidence.

### 7.1 Verified indexing reasons observed in GSC alerts

Search Console reported the following non-indexing reasons between 2026-08-07 and 2026-08-17:

1. Not found (404)
2. Soft 404
3. Blocked by robots.txt
4. Excluded by `noindex` tag
5. Alternate page with proper canonical tag
6. Duplicate without user-selected canonical
7. Page with redirect
8. Duplicate, Google chose different canonical than user

Search Console also specifically reported sitemap-related cases for:

- Duplicate without user-selected canonical
- Soft 404

These categories are **verified**, but affected-URL counts were not included in the emails and must be captured from the Page indexing report.

### 7.2 Required exact report values

| Field | Value |
|---|---:|
| Indexed pages | NOT CAPTURED |
| Not indexed pages | NOT CAPTURED |
| Last report update | NOT CAPTURED |
| Per-reason affected URL counts | NOT CAPTURED |

Do not classify a high non-indexed count as an error by itself. Filter/sort parameter URLs, redirects, and alternate canonical URLs may correctly remain non-indexed.

## 8. Core Web Vitals Baseline

Search Console email history was checked for `aipremium.tools` Core Web Vitals notifications and no matching CWV notification was found. This does **not** mean CWV is good; absence of an email is not a report result.

Required authenticated report values:

| Device | Good URL groups | Need improvement URL groups | Poor URL groups | Dominant failing metric(s) | Last update |
|---|---:|---:|---:|---|---|
| Mobile | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED |
| Desktop | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED |

Where reported, record whether the limiting metric is:

- LCP
- INP
- CLS

Search Console Core Web Vitals is field data based on real-world usage and may omit URL groups without enough data. A missing URL group must not be interpreted as a pass.

## 9. Sitemap / Property Context

### Captured

- Property type: **Domain property**
- Google Search impression collection began: **2026-08-06**
- Search Console emails confirm sitemap-associated indexing alerts exist.

### Still required from authenticated GSC UI/API

- Verified owner/access level used for the export
- Submitted sitemap URL(s)
- Last read date
- Submitted/discovered URL counts if shown
- Sitemap processing status/errors

Current production canonical target is `https://aipremium.tools`. Historic `www.aipremium.tools` search artifacts must be treated as regression evidence, not as a second desired canonical property.

## 10. Merchant/Search Context Signal

A Search Console message received on 2026-08-21 reported that **49 active products** from `aipremium.tools` were not on the Google Search Shopping tab.

This is useful growth context, but it is **not** an indexing-count substitute and is not used to populate Search Performance totals.

## 11. Access and Evidence Audit Performed on 2026-09-03

The execution environment was checked before declaring the remaining part blocked:

1. No authenticated Google Search Console report/API action is currently exposed to this execution session.
2. The available plugin catalog was searched for Google Search Console / GSC / webmaster / search analytics integrations; no usable Search Console integration was available.
3. Connected Google Drive was searched for existing AIPT Search Console, GSC, Core Web Vitals, query, page, or performance exports. No relevant export was found.
4. Connected Gmail **did** contain authoritative Search Console transactional evidence and was used to capture property type, data-start date, the 40-click milestone, indexing-reason categories, sitemap-related issue categories, and Shopping-tab context.
5. The AIPT repository was searched for `google-site-verification` and Search Console/GSC configuration evidence; no matching repository file was found.
6. Current production `main` was verified at `8dddbb8eeb8aa9f3d98a4ecdf3cf99b1afd57461` before this baseline record was created.
7. Public crawl/search evidence confirms that Google can discover AIPT pages, but public search snippets/site queries do **not** provide the private Search Console impressions, CTR, exact query/page tables, indexing counts, or Core Web Vitals dataset required to close AIPT-0005.

## 12. Why Public Proxies Are Not Substituted

AIPT-0005 is specifically a Search Console baseline. The following are useful diagnostic signals but are not substitutes for authenticated GSC report data:

- `site:` searches
- sitemap URL counts
- crawler/search-engine snippets
- PageSpeed Insights lab tests
- server logs
- third-party keyword estimates

Using those sources to populate GSC fields would create a false baseline and corrupt later before/after comparisons.

## 13. Exact Completion Procedure Once GSC Report Access Is Available

1. Open the verified `aipremium.tools` Domain property.
2. Performance > Search results.
3. Set Search type to Web.
4. Set date to custom `2026-08-06` through `2026-09-02` (or the newest equivalent 28 complete days if GSC data freshness lags).
5. Select Clicks, Impressions, Average CTR, and Average position.
6. Export the Queries view.
7. Export the Pages view.
8. Record the four property-level totals.
9. Repeat for `2026-06-05` through `2026-09-02`; annotate that actual Search Console history begins 2026-08-06.
10. Open Indexing > Pages and record indexed/not-indexed totals plus each reason/count.
11. Open Experience > Core Web Vitals and record Mobile and Desktop Good / Need improvement / Poor groups and failing metrics.
12. Open Sitemaps and record submission/read/error state.
13. Store raw exports in a restricted operational location; do not commit private Search Console exports if they contain data that should not be public.
14. Update this file with aggregate baseline numbers and a private export reference/hash, not credentials.

## 14. Official Google Reference Basis

Current Google Search Console documentation checked on 2026-09-03:

- Performance report overview: https://support.google.com/webmasters/answer/7576553
- Performance data/export behavior: https://support.google.com/webmasters/answer/17011364
- Query/page dimensions and data limitations: https://support.google.com/webmasters/answer/17011259
- Exporting report data: https://support.google.com/webmasters/answer/12919797
- Page indexing report: https://support.google.com/webmasters/answer/7440203
- Core Web Vitals report: https://support.google.com/webmasters/answer/9205520

Important interpretation notes from Google documentation:

- Search Console Performance supports configurable date ranges and query/page dimensions.
- Report exports can be limited to the rows shown by Search Console, while chart/report totals can include data beyond table row limits.
- Some queries are anonymized for privacy and therefore do not appear as table rows.
- Page indexing reports indexed and non-indexed URL totals/reasons.
- Core Web Vitals uses real-world field data and groups URLs by Good / Need improvement / Poor based on LCP, INP, and CLS.

## 15. Acceptance State

### Completed

- Search Console **Domain property** status verified from Google transactional evidence.
- First Search Console impression-collection date verified as **2026-08-06**.
- Verified adjacent performance milestone captured: **40 clicks / past 28 days as of 2026-08-31**.
- Exact 28-day and 90-day requested windows locked.
- Required metrics/dimensions locked.
- Eight verified indexing-reason categories captured from Search Console alerts.
- Sitemap-specific duplicate/soft-404 alert evidence captured.
- Shopping-tab signal captured: 49 active products not present there as of 2026-08-21.
- Existing Drive export search completed.
- Gmail Search Console evidence audit completed.
- Repository verification/config search completed.
- Public proxy substitution explicitly prohibited.
- Exact completion/runbook documented.
- No production change made.

### Still blocked

The authenticated Search Console report/API dataset itself has not been retrieved in this environment. Therefore these acceptance items remain open:

- Exact 28-day totals for the frozen window
- Exact 90-day totals
- Query export
- Page export
- Indexed/not-indexed totals and per-reason counts
- Mobile/Desktop Core Web Vitals report values
- Full sitemap submission/read state

## 16. Gate

**AIPT-0005 STATUS: PARTIAL / BLOCKED ON AUTHENTICATED GSC REPORT EXPORT.**

Do not label this step PASS until the exact Search Console exports/report totals above are captured. The verified Gmail evidence is authoritative supporting baseline evidence, but it does not replace the report tables and counts required by AIPT-0005.
