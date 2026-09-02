import type { Metadata } from "next";

export const SITE_NAME = "Like In House";
export const SITE_TAGLINE_ES = "Tours auténticos en Perú";
export const SITE_TAGLINE_EN = "Authentic tours in Peru";
export const DEFAULT_OG_IMAGE = "/opengraph-image";
export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouseperu.com";
  return raw.replace(/\/$/, "");
}

export function ogLocale(locale: string): string {
  return locale === "es" ? "es_PE" : "en_US";
}

/**
 * Build alternates.languages for hreflang. Accepts a map {es, en} with full paths (with leading slash)
 * or a single canonical path and we derive both locales from it.
 */
export function buildAlternates(opts: {
  locale: string;
  /** Path segment after `/{locale}`. Must start with "/" or be "". Example: "/tours" or "/tours/foo" */
  pathByLocale: { es: string; en: string } | string;
}): NonNullable<Metadata["alternates"]> {
  const base = getBaseUrl();
  const paths =
    typeof opts.pathByLocale === "string"
      ? { es: opts.pathByLocale, en: opts.pathByLocale }
      : opts.pathByLocale;

  const canonicalLocale = (opts.locale as Locale) in { es: 1, en: 1 } ? (opts.locale as Locale) : "es";
  const canonicalPath = paths[canonicalLocale];

  return {
    canonical: `${base}/${canonicalLocale}${canonicalPath}`,
    languages: {
      es: `${base}/es${paths.es}`,
      en: `${base}/en${paths.en}`,
      "x-default": `${base}/es${paths.es}`,
    },
  };
}

export interface BuildMetadataOptions {
  title: string;
  description: string;
  locale: string;
  /** Path segment(s) after `/{locale}`. Use a string if both locales share the same slug, or an object for localized paths. */
  pathByLocale: { es: string; en: string } | string;
  /** Absolute URL of the preview image. Optional — falls back to site-wide OG image. */
  image?: string | null;
  /** Title template suffix. Defaults to "Like In House". Pass null to disable. */
  siteName?: string | null;
  /** OG type. Defaults to "website". */
  ogType?: "website" | "article";
  /** If true, emits noindex. */
  noindex?: boolean;
  /** Keywords for search engines. */
  keywords?: string[];
  /** Article metadata (only when ogType === "article"). */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

/**
 * Single source of truth for page metadata: canonical, hreflang, OpenGraph, Twitter Card, robots.
 * Use this inside every `generateMetadata` in the public site.
 */
export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const base = getBaseUrl();
  const paths =
    typeof opts.pathByLocale === "string"
      ? { es: opts.pathByLocale, en: opts.pathByLocale }
      : opts.pathByLocale;

  const locale = (opts.locale as Locale) in { es: 1, en: 1 } ? (opts.locale as Locale) : "es";
  const currentPath = paths[locale];
  const canonicalUrl = `${base}/${locale}${currentPath}`;

  const siteName = opts.siteName === undefined ? SITE_NAME : opts.siteName ?? undefined;
  const image = opts.image || `${base}${DEFAULT_OG_IMAGE}`;

  const metadata: Metadata = {
    title: opts.title,
    description: opts.description,
    ...(opts.keywords && opts.keywords.length > 0 ? { keywords: opts.keywords } : {}),
    alternates: buildAlternates({ locale, pathByLocale: paths }),
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonicalUrl,
      siteName: siteName ?? undefined,
      type: opts.ogType || "website",
      locale: ogLocale(locale),
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
      ...(opts.ogType === "article" && opts.article
        ? {
            publishedTime: opts.article.publishedTime,
            modifiedTime: opts.article.modifiedTime,
            authors: opts.article.author ? [opts.article.author] : undefined,
            section: opts.article.section,
            tags: opts.article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    robots: opts.noindex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };

  return metadata;
}

/** Safely encode JSON-LD: escapes `<`, `>`, `&`, `/` to prevent breaking the `<script>` tag. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\//g, "\\u002f");
}

/** Organization / TravelAgency schema — for the site-wide root layout. */
export function travelAgencyJsonLd(locale: string) {
  const base = getBaseUrl();
  const isEs = locale === "es";
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${base}#organization`,
    name: SITE_NAME,
    description: isEs
      ? "Agencia de turismo peruana con experiencias auténticas, guías locales y atención personalizada en Cusco, Machu Picchu, Valle Sagrado, Lago Titicaca y más."
      : "Peruvian travel agency offering authentic experiences with local guides in Cusco, Machu Picchu, Sacred Valley, Lake Titicaca and more.",
    url: `${base}/${locale}`,
    logo: `${base}/logo.png`,
    image: `${base}${DEFAULT_OG_IMAGE}`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "PE",
      addressRegion: "Cusco",
    },
    areaServed: [
      { "@type": "Place", name: "Peru" },
      { "@type": "Place", name: "Cusco" },
      { "@type": "Place", name: "Machu Picchu" },
      { "@type": "Place", name: "Sacred Valley" },
      { "@type": "Place", name: "Lake Titicaca" },
    ],
    sameAs: [
      "https://www.instagram.com/likeinhouseperu",
      "https://www.facebook.com/likeinhouseperu",
      "https://www.tiktok.com/@likeinhouseperu",
    ],
  };
}

export interface TouristTripTier {
  labelEs?: string | null;
  labelEn?: string | null;
  priceUsd: number | string;
  isDefault?: boolean;
}

export interface TouristTripInput {
  locale: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  shortDescEs?: string | null;
  shortDescEn?: string | null;
  imageUrls: string[];
  durationDays?: number | null;
  durationHours?: number | null;
  destinationEs?: string | null;
  destinationEn?: string | null;
  tiers?: TouristTripTier[];
  basePriceUsd?: number | string | null;
  categoryEs?: string | null;
  categoryEn?: string | null;
  updatedAt?: Date | string | null;
}

/** TouristTrip schema — far more appropriate than Product for tour packages. */
export function touristTripJsonLd(t: TouristTripInput) {
  const base = getBaseUrl();
  const isEs = t.locale === "es";
  const name = isEs ? t.nameEs : t.nameEn;
  const description = (isEs ? t.shortDescEs : t.shortDescEn) || undefined;
  const url = `${base}/${t.locale}/tours/${t.slug}`;

  const defaultTier =
    t.tiers?.find((x) => x.isDefault) || t.tiers?.[0] || null;
  const price = defaultTier
    ? Number(defaultTier.priceUsd)
    : t.basePriceUsd != null
      ? Number(t.basePriceUsd)
      : null;

  const destination = (isEs ? t.destinationEs : t.destinationEn) || undefined;

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": url,
    name,
    description,
    url,
    image: t.imageUrls && t.imageUrls.length > 0 ? t.imageUrls.slice(0, 6) : undefined,
    ...(destination
      ? {
          touristType: t.categoryEs || t.categoryEn || undefined,
          itinerary: {
            "@type": "Place",
            name: destination,
            address: { "@type": "PostalAddress", addressCountry: "PE" },
          },
        }
      : {}),
    provider: { "@id": `${base}#organization`, "@type": "TravelAgency", name: SITE_NAME },
    ...(t.durationDays && t.durationDays > 0
      ? { duration: `P${t.durationDays}D` }
      : t.durationHours && t.durationHours > 0
        ? { duration: `PT${t.durationHours}H` }
        : {}),
    ...(price != null && price > 0
      ? {
          offers: {
            "@type": "Offer",
            price: price.toFixed(2),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
  };
}

export interface BlogPostingInput {
  locale: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  contentPlainEs?: string | null;
  contentPlainEn?: string | null;
  excerptEs?: string | null;
  excerptEn?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  category?: string | null;
  authorName?: string | null;
}

export function blogPostingJsonLd(p: BlogPostingInput) {
  const base = getBaseUrl();
  const isEs = p.locale === "es";
  const title = isEs ? p.titleEs : p.titleEn;
  const description =
    (isEs ? p.excerptEs : p.excerptEn) ||
    (isEs ? p.contentPlainEs : p.contentPlainEn) ||
    undefined;
  const url = `${base}/${p.locale}/blog/${p.slug}`;
  const published = p.publishedAt ? new Date(p.publishedAt).toISOString() : undefined;
  const modified = p.updatedAt ? new Date(p.updatedAt).toISOString() : published;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    image: p.coverImageUrl || `${base}${DEFAULT_OG_IMAGE}`,
    datePublished: published,
    dateModified: modified,
    articleSection: p.category || undefined,
    author: {
      "@type": "Organization",
      name: p.authorName || SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${base}/logo.png` },
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Path segment after `/{locale}`. Example: "/tours", "/tours/slug". Use "" for the homepage. */
  path: string;
}

export function breadcrumbJsonLd(locale: string, items: BreadcrumbItem[]) {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${base}/${locale}${it.path}`,
    })),
  };
}
