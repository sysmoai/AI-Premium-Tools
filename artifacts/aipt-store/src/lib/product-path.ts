/** Public URL of a product: its slug when it has one, otherwise its numeric id. */
export function productPath(product: { id: number; slug?: string }): string {
  return `/products/${product.slug || product.id}`;
}

/** Resolve a /products/:id route param (numeric id or slug) to a product id. */
export function resolveProductId(
  param: string | undefined,
  products: ReadonlyArray<{ id: number; slug?: string }> | undefined,
): number | undefined {
  if (!param) return undefined;
  if (/^[1-9]\d*$/.test(param)) return Number(param);
  return products?.find((product) => product.slug === param)?.id;
}
