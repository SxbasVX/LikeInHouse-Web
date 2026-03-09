import { db } from "@/server/lib/db";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Fetch all published tours and blog posts from the database
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

    const sitemapEntries: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/es`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/en`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/es/tours`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/en/tours`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/es/nosotros`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/en/about`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/es/contacto`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/en/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        // Blog index
        {
            url: `${baseUrl}/es/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/en/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        // FAQ
        {
            url: `${baseUrl}/es/faq`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/en/faq`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
    ];

    // Add dynamic tour URLs for both languages
    for (const tour of publishedTours) {
        sitemapEntries.push(
            {
                url: `${baseUrl}/es/tours/${tour.slug}`,
                lastModified: tour.updatedAt,
                changeFrequency: "weekly",
                priority: 0.9,
            },
            {
                url: `${baseUrl}/en/tours/${tour.slug}`,
                lastModified: tour.updatedAt,
                changeFrequency: "weekly",
                priority: 0.9,
            },
        );
    }

    // Add dynamic blog post URLs for both languages
    for (const post of publishedPosts) {
        sitemapEntries.push(
            {
                url: `${baseUrl}/es/blog/${post.slug}`,
                lastModified: post.updatedAt,
                changeFrequency: "weekly",
                priority: 0.7,
            },
            {
                url: `${baseUrl}/en/blog/${post.slug}`,
                lastModified: post.updatedAt,
                changeFrequency: "weekly",
                priority: 0.7,
            },
        );
    }

    return sitemapEntries;
}
