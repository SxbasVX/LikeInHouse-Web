import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { Decimal } from "@prisma/client/runtime/library";

// ─── Helpers ───

function serializeDecimals<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Decimal) return Number(obj) as unknown as T;
    if (Array.isArray(obj)) return obj.map(serializeDecimals) as unknown as T;
    if (typeof obj === "object" && obj.constructor === Object) {
        const result: any = {};
        for (const key of Object.keys(obj as any)) {
            result[key] = serializeDecimals((obj as any)[key]);
        }
        return result as T;
    }
    return obj;
}

// ─── Cache Tags ───
export const CACHE_TAGS = {
    tours: "tours",
    content: "content",
    blog: "blog",
    settings: "settings",
} as const;

// ─── Cached Queries ───

export const getCachedFeaturedTours = unstable_cache(
    async () => {
        const tours = await db.tour.findMany({
            where: { status: "PUBLISHED", isActive: true, isFeatured: true },
            take: 6,
            orderBy: { sortOrder: "asc" },
            include: {
                images: { where: { isPrimary: true }, take: 1 },
                pricing: { select: { basePriceUsdAdult: true } },
            },
        });
        return tours.map((t) => ({ ...t, pricing: serializeDecimals(t.pricing) }));
    },
    ["featured-tours"],
    { revalidate: 300, tags: [CACHE_TAGS.tours] }
);

export const getCachedDestinations = unstable_cache(
    async () => {
        const tours = await db.tour.findMany({
            where: { status: "PUBLISHED", isActive: true },
            select: { destination: true },
            distinct: ["destination"],
        });
        return tours.map((t) => t.destination);
    },
    ["destinations"],
    { revalidate: 600, tags: [CACHE_TAGS.tours] }
);

export const getCachedCategories = unstable_cache(
    async () => {
        const tours = await db.tour.findMany({
            where: { status: "PUBLISHED", isActive: true },
            select: { category: true },
            distinct: ["category"],
        });
        return tours.map((t) => t.category);
    },
    ["categories"],
    { revalidate: 600, tags: [CACHE_TAGS.tours] }
);

export const getCachedToursByDestination = unstable_cache(
    async () => {
        const tours = await db.tour.findMany({
            where: { status: "PUBLISHED", isActive: true },
            select: {
                slug: true,
                nameEs: true,
                nameEn: true,
                destination: true,
                category: true,
            },
            orderBy: [{ destination: "asc" }, { sortOrder: "asc" }, { nameEs: "asc" }],
        });

        const grouped: Record<string, typeof tours> = {};
        for (const tour of tours) {
            if (!grouped[tour.destination]) grouped[tour.destination] = [];
            grouped[tour.destination].push(tour);
        }
        return grouped;
    },
    ["tours-by-destination"],
    { revalidate: 300, tags: [CACHE_TAGS.tours] }
);

export const getCachedFaqs = unstable_cache(
    async () => {
        return db.fAQ.findMany({
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
        });
    },
    ["faqs"],
    { revalidate: 600, tags: [CACHE_TAGS.content] }
);

export const getCachedHomeSections = unstable_cache(
    async () => {
        return db.homeSection.findMany({
            where: { isVisible: true },
            orderBy: { sortOrder: "asc" },
        });
    },
    ["home-sections"],
    { revalidate: 600, tags: [CACHE_TAGS.content] }
);

export const getCachedNavigation = unstable_cache(
    async () => {
        return db.navItem.findMany({
            where: { isVisible: true, parentId: null },
            orderBy: { sortOrder: "asc" },
            include: { children: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
        });
    },
    ["navigation"],
    { revalidate: 600, tags: [CACHE_TAGS.content] }
);

export const getCachedTestimonials = unstable_cache(
    async () => {
        return db.testimonial.findMany({
            where: { isApproved: true },
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
            take: 10,
        });
    },
    ["testimonials"],
    { revalidate: 600, tags: [CACHE_TAGS.content] }
);

export const getCachedSettings = unstable_cache(
    async () => {
        const settings = await db.setting.findMany();
        return Object.fromEntries(settings.map((s) => [s.key, s.value]));
    },
    ["settings"],
    { revalidate: 600, tags: [CACHE_TAGS.settings] }
);
