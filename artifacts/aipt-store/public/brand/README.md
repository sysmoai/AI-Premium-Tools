# AIPT public brand assets

Status: **PARTIAL / APPROVED-WORDMARK ASSET BLOCKED**  
Owner: `@sysmoai`

This directory is the canonical public location for AIPT-owned brand assets used by the storefront, social cards, transactional surfaces and future customer documents.

## Current canonical asset

### `aipt-icon.svg`

- Exact copy of the existing production `public/favicon.svg` mark.
- Temporary canonical **icon only**.
- Purple-to-blue gradient `#8B5CF6` -> `#3B82F6` with the existing white `AI` mark.
- It was copied without redrawing, tracing, restyling or reinterpretation.
- The existing `favicon.svg` remains in place so this governance change does not alter live favicon behavior.

## Approved full-wordmark assets still required

The following files must not be created from inference or approximation. They may be added only from authoritative AIPT-approved source assets:

- `aipt-logo-primary.svg` - light navbar/footer/invoice/email use.
- `aipt-logo-reversed.svg` - dark/gradient surfaces.
- `aipt-logo-horizontal.svg` - wide headers/receipts/partnership surfaces.
- `aipt-social-1200x630.png` - default social/Open Graph use.

Tracked blocker: GitHub issue **#301** (`AIPT-0101 - Approved full AIPT logo source assets`).

## Provenance rule

Accept an asset only when all of the following are true:

1. it is explicitly identified as **AIPT / AI Premium Tools**, not another portfolio brand;
2. the source is an owner-approved AIPT asset package or a previously approved AIPT production source;
3. filename, intended surface and light/dark use are documented;
4. no customer/provider/private data is embedded;
5. the asset is reviewed at small/header/social sizes before rollout.

## Prohibited actions

Do not:

- generate a new AIPT logo with AI;
- reconstruct a wordmark from typography/CSS and call it approved;
- trace the icon to invent missing wordmark variants;
- recolor or adapt another business unit's logo;
- silently replace the current production mark.

## Rollout gate

AIPT-0102 may replace current CSS/text logo recreation only after the required approved wordmark source exists here. Until then, the existing live presentation remains unchanged and `aipt-icon.svg` is available as the canonical temporary icon for new surfaces that need the current approved production mark.
