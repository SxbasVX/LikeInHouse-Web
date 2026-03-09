import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin/", // Prevent search engines from crawling the admin panel
                "/api/",   // Internal API routes
                "/[locale]/admin/", // Localized admin panel if accessed
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
