import { AIPT_COMMERCIAL_RULES, findCommercialRule, isCommerciallyValidProduct } from "./commercial-policy";

/**
 * Public product slugs are the stable ids of the commercial allow-list
 * (e.g. "chatgpt-plus"), so they need no D1 write and roll back with the code.
 *
 * A rule pattern can match more than one sellable row. The lowest id owns the
 * slug; any other row keeps its numeric URL, so a redirect can never land on a
 * different product.
 */
export type SlugProductRow = {
  id: number;
  name: string;
  price_bdt: number;
  is_active: number;
  commercial_state?: string | null;
};

const KNOWN_SLUGS: ReadonlySet<string> = new Set(AIPT_COMMERCIAL_RULES.map((rule) => rule.id));

export function isKnownProductSlug(slug: string): boolean {
  return KNOWN_SLUGS.has(slug);
}

export async function loadSlugOwners(db: D1Database): Promise<Map<string, SlugProductRow>> {
  const rows = await db
    .prepare("SELECT id, name, price_bdt, is_active, commercial_state FROM products WHERE is_active = 1 ORDER BY id")
    .all<SlugProductRow>();
  const owners = new Map<string, SlugProductRow>();
  for (const row of rows.results ?? []) {
    if (!isCommerciallyValidProduct(row)) continue;
    const slug = findCommercialRule(row.name)?.id;
    if (!slug) continue;
    const current = owners.get(slug);
    if (!current || row.id < current.id) owners.set(slug, row);
  }
  return owners;
}

/** The slug this row owns, or undefined when it must keep its numeric URL. */
export function ownedSlug(row: { id: number; name: string }, owners: Map<string, SlugProductRow>): string | undefined {
  const slug = findCommercialRule(String(row.name))?.id;
  return slug && owners.get(slug)?.id === row.id ? slug : undefined;
}
