# AIPT-0005 — Google Search Console Baseline

**Status:** BLOCKED ON AUTHENTICATED GOOGLE SEARCH CONSOLE DATA ACCESS  
**Date:** 2026-09-03 (Asia/Dhaka)  
**Property target:** `aipremium.tools`  
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

## 2. Frozen Date Windows

To avoid mixing incomplete/preliminary current-day data into the baseline, use completed calendar days only.

| Window | Start | End | Notes |
|---|---|---|---|
| 28 complete days | 2026-08-06 | 2026-09-02 | Primary short-term baseline |
| 90 complete days | 2026-06-05 | 2026-09-02 | Primary trend baseline |

If Search Console later shows that the newest complete data date is earlier than 2026-09-02, preserve the same period lengths ending on the newest complete Search Console date and record the adjusted dates explicitly.

## 3. Required Performance Export

For each date window, export Google Search Console **Search results** performance with Web search selected and no query/page filters unless explicitly noted.

Record the property-level totals:

- Clicks
- Impressions
- CTR
- Average position

Export at minimum these table dimensions:

### 3.1 Queries

Columns required:

- Query
- Clicks
- Impressions
- CTR
- Position

### 3.2 Pages

Columns required:

- Page
- Clicks
- Impressions
- CTR
- Position

Preserve the raw exports. Do not manually delete zero rows or normalize URLs before storing the source copy.

## 4. Baseline Metrics — 28 Complete Days

**Window:** 2026-08-06 through 2026-09-02

| Metric | Value |
|---|---:|
| Clicks | NOT CAPTURED — authenticated GSC data unavailable |
| Impressions | NOT CAPTURED — authenticated GSC data unavailable |
| CTR | NOT CAPTURED — authenticated GSC data unavailable |
| Average position | NOT CAPTURED — authenticated GSC data unavailable |
| Query rows exported | NOT CAPTURED |
| Page rows exported | NOT CAPTURED |

### Top queries

NOT CAPTURED — do not infer from public search results.

### Top pages

NOT CAPTURED — do not infer from sitemap, crawler visibility, or public search snippets.

## 5. Baseline Metrics — 90 Complete Days

**Window:** 2026-06-05 through 2026-09-02

| Metric | Value |
|---|---:|
| Clicks | NOT CAPTURED — authenticated GSC data unavailable |
| Impressions | NOT CAPTURED — authenticated GSC data unavailable |
| CTR | NOT CAPTURED — authenticated GSC data unavailable |
| Average position | NOT CAPTURED — authenticated GSC data unavailable |
| Query rows exported | NOT CAPTURED |
| Page rows exported | NOT CAPTURED |

### Top queries

NOT CAPTURED — do not infer from public search results.

### Top pages

NOT CAPTURED — do not infer from sitemap, crawler visibility, or public search snippets.

## 6. Page Indexing Baseline

Capture the Search Console **Page indexing** report for the same property.

Required values:

| Field | Value |
|---|---:|
| Indexed pages | NOT CAPTURED |
| Not indexed pages | NOT CAPTURED |
| Last report update | NOT CAPTURED |

Record every visible non-indexing reason with its affected URL count, including but not limited to:

- Not found (404)
- Soft 404
- Page with redirect
- Duplicate / canonical-related states
- Crawled — currently not indexed
- Discovered — currently not indexed
- Excluded by `noindex`
- Blocked by robots.txt
- Server error (5xx)
- Other Google-reported states

Do not classify a high non-indexed count as an error by itself. Filter/sort parameter URLs and redirects may correctly remain non-indexed.

## 7. Core Web Vitals Baseline

Capture Search Console **Core Web Vitals** for both Mobile and Desktop.

Required values for each device type:

| Device | Good URL groups | Need improvement URL groups | Poor URL groups | Dominant failing metric(s) | Last update |
|---|---:|---:|---:|---|---|
| Mobile | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED |
| Desktop | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED | NOT CAPTURED |

Where reported, record the affected URL-group examples and whether the limiting metric is:

- LCP
- INP
- CLS

Search Console Core Web Vitals is field data based on real-world usage and may omit URL groups without enough data. A missing URL group must not be interpreted as a pass.

## 8. Sitemap / Property Context

Record from Search Console:

- Exact property type: Domain property or URL-prefix property.
- Verified owner/access level used for the export.
- Submitted sitemap URL(s).
- Last read date.
- Submitted URL count if shown.
- Discovered/indexed status where shown.
- Any sitemap processing errors.

Current production canonical target is `https://aipremium.tools`. Historic `www.aipremium.tools` search artifacts must be treated as regression evidence, not as a second desired canonical property.

## 9. Access and Evidence Audit Performed on 2026-09-03

The execution environment was checked before declaring this task blocked:

1. No authenticated Google Search Console connector/API action is currently exposed to this execution session.
2. The available plugin catalog was searched for Google Search Console / GSC / webmaster / search analytics integrations; no usable Search Console integration was available.
3. Connected Google Drive was searched for existing AIPT Search Console, GSC, Core Web Vitals, query, or performance exports. No relevant export was found.
4. The AIPT repository was searched for `google-site-verification` and Search Console/GSC configuration evidence; no matching repository file was found.
5. Current production `main` was verified at `8dddbb8eeb8aa9f3d98a4ecdf3cf99b1afd57461` before this baseline record was created.
6. Public crawl/search evidence confirms that Google can discover AIPT pages, but public search snippets/site queries do **not** provide the private Search Console clicks, impressions, CTR, query, page, indexing, or Core Web Vitals dataset required by AIPT-0005.

## 10. Why Public Proxies Are Not Substituted

AIPT-0005 is specifically a Search Console baseline. The following are useful diagnostic signals but are not substitutes for authenticated GSC data:

- `site:` searches
- sitemap URL counts
- crawler/search-engine snippets
- PageSpeed Insights lab tests
- server logs
- third-party keyword estimates

Using those sources to populate GSC fields would create a false baseline and corrupt later before/after comparisons.

## 11. Exact Completion Procedure Once GSC Access Is Available

1. Open the verified `aipremium.tools` Search Console property.
2. Performance > Search results.
3. Set Search type to Web.
4. Set date to custom `2026-08-06` through `2026-09-02` (or the newest equivalent 28 complete days if GSC data freshness lags).
5. Select Clicks, Impressions, Average CTR, and Average position.
6. Export the Queries view.
7. Export the Pages view.
8. Record the four property-level totals.
9. Repeat for `2026-06-05` through `2026-09-02` (or the newest equivalent 90 complete days).
10. Open Indexing > Pages and record indexed/not-indexed totals plus each reason/count.
11. Open Experience > Core Web Vitals and record Mobile and Desktop Good / Need improvement / Poor groups and failing metrics.
12. Open Sitemaps and record submission/read/error state.
13. Store raw exports in a restricted operational location; do not commit private Search Console exports if they contain data that should not be public.
14. Update this file with aggregate baseline numbers and a private export reference/hash, not credentials.

## 12. Official Google Reference Basis

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

## 13. Acceptance State

### Completed

- Exact baseline scope locked.
- Exact 28-day and 90-day complete-day windows locked.
- Required metrics/dimensions locked.
- Indexing/CWV capture schema locked.
- Existing Drive export search completed.
- Repository verification/config search completed.
- Public proxy substitution explicitly prohibited.
- Exact completion/runbook documented.
- No production change made.

### Blocked

Authenticated Search Console data itself has not been retrieved in this environment. Therefore AIPT-0005 is **not PASS** and must not be marked complete until the actual GSC metrics/exports are captured and recorded.

## 14. Gate

**AIPT-0005 STATUS: BLOCKED — AUTHENTICATED GSC DATA REQUIRED.**

Do not begin interpreting SEO wins/losses against a fabricated baseline. Subsequent roadmap work may continue only if the missing GSC baseline is explicitly carried as a measurement debt and completed at the first point authenticated Search Console access/export becomes available.
