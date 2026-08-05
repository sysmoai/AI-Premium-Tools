// Canonical public site URL used for absolute links in SEO/social tags and
// the sitemap. Override at build time with VITE_SITE_URL if this changes again.
export const SITE_URL: string = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://aipremium.tools"
).replace(/\/$/, "");
