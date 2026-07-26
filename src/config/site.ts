// Canonical public site URL used for absolute links in SEO/social tags and
// the sitemap. Override at build time with VITE_SITE_URL once the production
// domain is known (e.g. https://aipt.com.bd).
export const SITE_URL: string = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://aipt.replit.app"
).replace(/\/$/, "");
