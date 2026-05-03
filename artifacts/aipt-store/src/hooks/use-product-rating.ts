export function getProductRating(id: number): number {
  const seed = (id * 9301 + 49297) % 233280;
  const r = 4.6 + (seed / 233280) * 0.35;
  return Math.round(r * 10) / 10;
}

export function getProductReviewCount(id: number): number {
  const seed = (id * 1103515245 + 12345) % 2147483648;
  return 47 + (seed % 266);
}
