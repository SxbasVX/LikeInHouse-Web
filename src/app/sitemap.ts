import { db } from "@/server/lib/db";
import { getBaseUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getFamilyBaseUrl, isFamilyHost } from "@/lib/family-site";
import { getFamilySiteSetting } from "@/server/lib/family-site";

const LOCALES = ["es", "en"] as const;

/** Build a sitemap entry with hreflang alternates for both locales. */
function localizedEntry(
  base: string,
  path: string,
  lastModified: Date,
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
  priority: number
): MetadataRoute.Sitemap[number][] {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) languages[loc] = `${base}/${loc}${path}`;
  languages["x-default"] = `${base}/es${path}`;

  return LOCALES.map((loc) => ({
    url: `${base}/${loc}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

// Web familiar: su propio sitemap con sus páginas y sólo los tours "Familia". Vacío mientras esté en borrador.
async function familySitemap(): Promise<MetadataRoute.Sitemap> {
  const { published } = await getFamilySiteSetting();
  if (!published) return [];

  const baseUrl = getFamilyBaseUrl();
  let tours: { slug: string; updatedAt: Date }[] = [];
  try {
    tours = await db.tour.findMany({
      where: { status: "PUBLISHED", isActive: true, isFamily: true },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    // Sin base disponible: se publica sólo lo estático.
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  entries.push(...localizedEntry(baseUrl, "", now, "daily", 1.0));
  entries.push(...localizedEntry(baseUrl, "/tours", now, "daily", 0.9));
  entries.push(...localizedEntry(baseUrl, "/nosotros", now, "monthly", 0.7));
  entries.push(...localizedEntry(baseUrl, "/contacto", now, "monthly", 0.8));
  entries.push(...localizedEntry(baseUrl, "/faq", now, "monthly", 0.6));
  for (const tour of tours) {
    entries.push(...localizedEntry(baseUrl, `/tours/${tour.slug}`, tour.updatedAt, "weekly", 0.9));
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  if (isFamilyHost(host)) return familySitemap();

  const baseUrl = getBaseUrl();

  let publishedTours: { slug: string; updatedAt: Date }[] = [];
  let publishedPosts: { slug: string; updatedAt: Date }[] = [];
  try {
    [publishedTours, publishedPosts] = await Promise.all([
      db.tour.findMany({
        where: { status: "PUBLISHED", isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      db.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);
  } catch {
    // Tables may not exist yet during initial deployment
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  entries.push(...localizedEntry(baseUrl, "", now, "daily", 1.0));
  entries.push(...localizedEntry(baseUrl, "/tours", now, "daily", 0.9));
  entries.push(...localizedEntry(baseUrl, "/nosotros", now, "monthly", 0.7));
  entries.push(...localizedEntry(baseUrl, "/contacto", now, "monthly", 0.8));
  entries.push(...localizedEntry(baseUrl, "/blog", now, "weekly", 0.8));
  entries.push(...localizedEntry(baseUrl, "/faq", now, "monthly", 0.6));
  entries.push(...localizedEntry(baseUrl, "/privacidad", now, "yearly", 0.3));
  entries.push(...localizedEntry(baseUrl, "/terminos", now, "yearly", 0.3));
  entries.push(...localizedEntry(baseUrl, "/politicas-cancelacion", now, "yearly", 0.3));
  entries.push(...localizedEntry(baseUrl, "/libro-reclamaciones", now, "yearly", 0.3));

  for (const tour of publishedTours) {
    entries.push(
      ...localizedEntry(baseUrl, `/tours/${tour.slug}`, tour.updatedAt, "weekly", 0.9)
    );
  }

  for (const post of publishedPosts) {
    entries.push(
      ...localizedEntry(baseUrl, `/blog/${post.slug}`, post.updatedAt, "monthly", 0.6)
    );
  }

  return entries;
}
