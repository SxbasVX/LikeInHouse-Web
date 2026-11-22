import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getBaseUrl } from "@/lib/seo";
import { getFamilyBaseUrl, isFamilyHost } from "@/lib/family-site";
import { getFamilySiteSetting } from "@/server/lib/family-site";

const AI_SCRAPERS = ["GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Google-Extended"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const isFamily = isFamilyHost(host);

  // Web familiar en borrador: no se indexa nada.
  if (isFamily && !(await getFamilySiteSetting()).published) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const baseUrl = isFamily ? getFamilyBaseUrl() : getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/pagar/",
          "/carrito",
          "/*?*utm_",
          "/*/tours/*/reservar",
        ],
      },
      {
        // Block AI scrapers from training models on the content
        userAgent: AI_SCRAPERS,
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
