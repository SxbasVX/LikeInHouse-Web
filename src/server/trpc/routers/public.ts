import { z } from "zod";
import { router, publicProcedure, rateLimitedProcedure } from "../trpc";
import { RATE_LIMITS } from "@/server/lib/rate-limit";
import { sanitizePlainText } from "@/server/lib/sanitize";
import {
  getCachedFeaturedTours,
  getCachedDestinations,
  getCachedCategories,
  getCachedToursByDestination,
  getCachedFaqs,
  getCachedHomeSections,
  getCachedNavigation,
  getCachedTestimonials,
  getCachedSettings,
} from "@/server/lib/cache";
import { serializeDecimals } from "@/server/lib/serialize";

export const publicRouter = router({
  // Tours publicados con paginación y filtros
  tours: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(24).default(9),
        search: z.string().max(100).optional(),
        destination: z.string().optional(),
        category: z.string().optional(),
        difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sort: z.enum(["price_asc", "price_desc", "newest", "popular"]).default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, destination, category, difficulty, sort } = input;
      const skip = (page - 1) * limit;

      const where: any = { status: "PUBLISHED", isActive: true };

      if (search) {
        const term = search.trim();
        where.OR = [
          { nameEs: { contains: term, mode: "insensitive" } },
          { nameEn: { contains: term, mode: "insensitive" } },
          { shortDescEs: { contains: term, mode: "insensitive" } },
          { shortDescEn: { contains: term, mode: "insensitive" } },
          { destination: { contains: term, mode: "insensitive" } },
          { category: { contains: term, mode: "insensitive" } },
        ];
      }

      if (destination) where.destination = { contains: destination, mode: "insensitive" };
      if (category) where.category = { contains: category, mode: "insensitive" };
      if (difficulty) where.difficulty = difficulty;
      if (input.minPrice !== undefined || input.maxPrice !== undefined) {
        where.pricing = { basePriceUsdAdult: {} };
        if (input.minPrice !== undefined) where.pricing.basePriceUsdAdult.gte = input.minPrice;
        if (input.maxPrice !== undefined) where.pricing.basePriceUsdAdult.lte = input.maxPrice;
      }

      let orderBy: any = { createdAt: "desc" };
      if (sort === "popular") orderBy = { isFeatured: "desc" };

      const [tours, total] = await Promise.all([
        ctx.db.tour.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            pricing: {
              select: {
                basePriceUsdAdult: true,
                promoDiscountPercent: true,
                promoStartDate: true,
                promoEndDate: true,
                promoLabelEs: true,
                promoLabelEn: true,
                tiers: {
                  where: { isDefault: true },
                  take: 1,
                  select: { priceUsd: true, isDefault: true, labelEs: true, labelEn: true },
                },
              },
            },
            _count: { select: { departures: true } },
          },
        }),
        ctx.db.tour.count({ where }),
      ]);

      return {
        tours: tours.map((t) => ({ ...t, pricing: serializeDecimals(t.pricing) })),
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Tours destacados (para homepage)
  featuredTours: publicProcedure.query(async () => {
    return getCachedFeaturedTours();
  }),

  // Tour por slug
  tourBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({
        where: { slug: input.slug, status: "PUBLISHED", isActive: true },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 12 },
          itinerary: { orderBy: { dayNumber: "asc" } },
          pricing: {
            include: { tiers: { orderBy: { sortOrder: "asc" } } },
          },
          includes: { orderBy: { sortOrder: "asc" } },
          departures: {
            where: { status: "AVAILABLE", departureDate: { gte: new Date() } },
            orderBy: { departureDate: "asc" },
            take: 12,
          },
          seasons: true,
        },
      });
      if (!tour) return null;
      return { ...tour, pricing: serializeDecimals(tour.pricing) };
    }),

  // Testimonios aprobados
  testimonials: publicProcedure.query(async () => {
    return getCachedTestimonials();
  }),

  // FAQs publicadas
  faqs: publicProcedure.query(async () => {
    return getCachedFaqs();
  }),

  // Secciones del home
  homeSections: publicProcedure.query(async () => {
    return getCachedHomeSections();
  }),

  // NavItems
  navigation: publicProcedure.query(async () => {
    return getCachedNavigation();
  }),

  // Blog posts publicados
  blogPosts: publicProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const [posts, total] = await Promise.all([
        ctx.db.blogPost.findMany({
          where: { isPublished: true },
          orderBy: { publishedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true, slug: true, titleEs: true, titleEn: true,
            excerptEs: true, excerptEn: true, coverImageUrl: true,
            category: true, publishedAt: true,
          },
        }),
        ctx.db.blogPost.count({ where: { isPublished: true } }),
      ]);
      return { posts, total, pages: Math.ceil(total / limit) };
    }),

  // Blog post individual
  blogPostBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.blogPost.findUnique({
        where: { slug: input.slug, isPublished: true },
      });
    }),

  // Settings públicos
  settings: publicProcedure.query(async () => {
    return getCachedSettings();
  }),

  // Tours agrupados por destino (para navbar dinámico)
  toursByDestination: publicProcedure.query(async () => {
    return getCachedToursByDestination();
  }),

  // Destinos únicos (para filtros)
  destinations: publicProcedure.query(async () => {
    return getCachedDestinations();
  }),

  // Categorías únicas (para filtros)
  categories: publicProcedure.query(async () => {
    return getCachedCategories();
  }),

  // Enviar mensaje de contacto (rate limited)
  submitContact: rateLimitedProcedure(RATE_LIMITS.contactForm)
    .input(
      z.object({
        name: z.string().min(1, "Nombre requerido").max(100),
        email: z.string().email("Email inválido"),
        phone: z.string().max(20).optional()
          .refine((val) => !val || /^\+?[\d\s\-().]{6,20}$/.test(val), { message: "Teléfono inválido" }),
        subject: z.string().min(1, "Asunto requerido").max(200),
        message: z.string().min(10, "Mensaje muy corto").max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contactMessage.create({
        data: {
          name: sanitizePlainText(input.name),
          email: input.email,
          phone: input.phone,
          subject: sanitizePlainText(input.subject),
          message: sanitizePlainText(input.message),
        },
      });
      return { success: true };
    }),
});
