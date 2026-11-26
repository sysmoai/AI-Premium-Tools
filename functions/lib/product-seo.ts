/**
 * The one source of product search copy, used by the server-rendered head, the
 * product API and (through the API) the storefront. It is built only from
 * fields the commercial allow-list already checks; D1 free text is not
 * commercially reviewed, so it is never used here.
 */
export function productSeo(row: { name: string; price_bdt: number }): { title: string; description: string } {
  const price = `৳${Number(row.price_bdt)}`;
  return {
    title: `${row.name} Price in Bangladesh — ${price} | AIPT`,
    description: `${row.name} from AIPT in Bangladesh at ${price}. Pay in BDT; AIPT confirms the provider-compatible activation method after payment verification.`,
  };
}
