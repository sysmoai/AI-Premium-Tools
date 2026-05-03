import { useEffect } from "react";

export interface SeoOptions {
  title: string;
  description?: string;
  image?: string | null;
  type?: "website" | "product" | "article";
  canonical?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  keywords?: string;
  noindex?: boolean;
}

const SITE_NAME = "AIPT — AI Premium Tools";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const JSON_LD_ID = "aipt-jsonld";

export function useSeo({ title, description, image, type = "website", canonical, jsonLd, keywords, noindex }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title.includes("AIPT") ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
    );

    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
    }
    if (keywords) {
      setMeta('meta[name="keywords"]', "name", "keywords", keywords);
    }

    // Open Graph
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    if (description) setMeta('meta[property="og:description"]', "property", "og:description", description);
    if (image) setMeta('meta[property="og:image"]', "property", "og:image", image);
    setMeta('meta[property="og:url"]', "property", "og:url", window.location.href);

    // Twitter
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    if (description) setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    if (image) setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);

    // Canonical
    setLink("canonical", canonical ?? window.location.href);

    // JSON-LD
    let script = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = JSON_LD_ID;
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

    return () => {
      // Clean up JSON-LD on unmount so the next page can write its own
      const s = document.getElementById(JSON_LD_ID);
      if (s) s.remove();
    };
  }, [title, description, image, type, canonical, keywords, noindex, JSON.stringify(jsonLd)]);
}
