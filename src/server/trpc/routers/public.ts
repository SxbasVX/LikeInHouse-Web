import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const publicRouter = router({
  // Tours publicados con paginación y filtros
  tours: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(24).default(9),
        destination: z.string().optional(),
        category: z.string().optional(),
        difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sort: z.enum(["price_asc", "price_desc", "newest", "popular"]).default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, destination, category, difficulty, sort } = input;
      const skip = (page - 1) * limit;

      const where: any = { status: "PUBLISHED" };
      if (destination) where.destination = { contains: destination, mode: "insensitive" };
      if (category) where.category = { contains: category, mode: "insensitive" };
      if (difficulty) where.difficulty = difficulty;

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
            pricing: { select: { basePricePenAdult: true, basePriceUsdAdult: true } },
            _count: { select: { departures: true } },
          },
        }),
        ctx.db.tour.count({ where }),
      ]);

      return { tours, total, pages: Math.ceil(total / limit), page };
    }),

  // Tours destacados (para homepage)
  featuredTours: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tour.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      take: 6,
      orderBy: { sortOrder: "asc" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        pricing: { select: { basePricePenAdult: true, basePriceUsdAdult: true } },
      },
    });
  }),

  // Tour por slug
  tourBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tour.findUnique({
        where: { slug: input.slug, status: "PUBLISHED" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          itinerary: { orderBy: { dayNumber: "asc" } },
          pricing: true,
          includes: { orderBy: { sortOrder: "asc" } },
          departures: {
            where: { status: "AVAILABLE", departureDate: { gte: new Date() } },
            orderBy: { departureDate: "asc" },
          },
          seasons: true,
        },
      });
    }),

  // Testimonios aprobados
  testimonials: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.testimonial.findMany({
      where: { isApproved: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 10,
    });
  }),

  // FAQs publicadas
  faqs: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.fAQ.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  // Secciones del home
  homeSections: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.homeSection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  // NavItems
  navigation: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.navItem.findMany({
      where: { isVisible: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: { children: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    });
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
  settings: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.setting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }),

  // Destinos únicos (para filtros)
  destinations: publicProcedure.query(async ({ ctx }) => {
    const tours = await ctx.db.tour.findMany({
      where: { status: "PUBLISHED" },
      select: { destination: true },
      distinct: ["destination"],
    });
    return tours.map((t) => t.destination);
  }),

  // Categorías únicas (para filtros)
  categories: publicProcedure.query(async ({ ctx }) => {
    const tours = await ctx.db.tour.findMany({
      where: { status: "PUBLISHED" },
      select: { category: true },
      distinct: ["category"],
    });
    return tours.map((t) => t.category);
  }),
});
