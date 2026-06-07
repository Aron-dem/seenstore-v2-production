import { useEffect } from "react";

const SITE_NAME   = "SEENSTORE";
const SITE_URL    = "https://seenstore.com";
const DEFAULT_IMG = `${SITE_URL}/opengraph.jpg`;

interface SEOProps {
  title:        string;
  description:  string;
  keywords?:    string;
  canonical?:   string;
  ogImage?:     string;
  noIndex?:     boolean;
  jsonLd?:      Record<string, unknown> | Record<string, unknown>[];
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  const id = "seo-json-ld-page";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id   = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  document.getElementById("seo-json-ld-page")?.remove();
}

export function useSEO({
  title,
  description,
  keywords,
  canonical,
  ogImage  = DEFAULT_IMG,
  noIndex  = false,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const url       = canonical ?? (SITE_URL + window.location.pathname);

    document.title = fullTitle;

    setMeta("description",         description);
    setMeta("robots",              noIndex ? "noindex, nofollow" : "index, follow");
    if (keywords) setMeta("keywords", keywords);

    setMeta("og:type",             "website",   "property");
    setMeta("og:site_name",        SITE_NAME,   "property");
    setMeta("og:title",            fullTitle,   "property");
    setMeta("og:description",      description, "property");
    setMeta("og:url",              url,         "property");
    setMeta("og:image",            ogImage,     "property");
    setMeta("og:image:width",      "1200",      "property");
    setMeta("og:image:height",     "630",       "property");
    setMeta("og:locale",           "ar_EG",     "property");
    setMeta("og:locale:alternate", "en_US",     "property");

    setMeta("twitter:card",        "summary_large_image");
    setMeta("twitter:title",       fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image",       ogImage);

    setLink("canonical", url);

    if (jsonLd) {
      setJsonLd(jsonLd);
    } else {
      removeJsonLd();
    }
  }, [title, description, keywords, canonical, ogImage, noIndex, jsonLd]);
}
