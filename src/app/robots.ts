import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

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
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Google-Extended"],
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
