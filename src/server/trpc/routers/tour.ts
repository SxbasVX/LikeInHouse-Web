import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  roleProtectedProcedure,
} from "../trpc";
import {
  tourListInputSchema,
  tourCreateSchema,
  tourUpdateSchema,
} from "@/lib/validators/tour";

const adminOrMarketing = roleProtectedProcedure(["ADMIN", "MARKETING"]);
const adminOnly = roleProtectedProcedure(["ADMIN"]);

export const tourRouter = router({
  // Lista paginada con filtros (admin)
  list: protectedProcedure
    .input(tourListInputSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search, isFeatured } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(status && { status }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(search && {
          OR: [
            { nameEs: { contains: search, mode: "insensitive" as const } },
            { nameEn: { contains: search, mode: "insensitive" as const } },
            { destination: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [tours, total] = await Promise.all([
        ctx.db.tour.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            pricing: { select: { basePricePenAdult: true, basePriceUsdAdult: true } },
            _count: { select: { reservations: true, departures: true } },
          },
        }),
        ctx.db.tour.count({ where }),
      ]);

      return {
        tours,
        total,
        pages: Math.ceil(total / limit),
        page,
      };
    }),

  // Detalle por ID (admin)
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({
        where: { id: input.id },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          itinerary: { orderBy: { dayNumber: "asc" } },
          pricing: true,
          includes: { orderBy: { sortOrder: "asc" } },
          seasons: true,
          departures: { orderBy: { departureDate: "asc" } },
        },
      });

      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      return tour;
    }),

  // Detalle por slug (publico)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({
        where: { slug: input.slug, status: "PUBLISHED" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          itinerary: { orderBy: { dayNumber: "asc" } },
          pricing: true,
          includes: { orderBy: { sortOrder: "asc" } },
          seasons: true,
          departures: {
            where: { status: "AVAILABLE", departureDate: { gte: new Date() } },
            orderBy: { departureDate: "asc" },
          },
        },
      });

      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      return tour;
    }),

  // Crear tour
  create: adminOrMarketing
    .input(tourCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { itinerary, pricing, includes, excludes, images, departures, ...tourData } = input;

      const existing = await ctx.db.tour.findUnique({ where: { slug: tourData.slug } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Ya existe un tour con ese slug" });
      }

      const tour = await ctx.db.tour.create({
        data: {
          ...tourData,
          status: "DRAFT",
          itinerary: {
            create: itinerary.map((day) => ({
              dayNumber: day.dayNumber,
              titleEs: day.titleEs,
              titleEn: day.titleEn,
              descriptionEs: day.descriptionEs,
              descriptionEn: day.descriptionEn,
            })),
          },
          pricing: {
            create: {
              basePricePenAdult: pricing.basePricePenAdult,
              basePriceUsdAdult: pricing.basePriceUsdAdult,
              basePricePenChild: pricing.basePricePenChild,
              basePriceUsdChild: pricing.basePriceUsdChild,
              groupDiscountPercent: pricing.groupDiscountPercent,
              groupMinPersons: pricing.groupMinPersons,
              promoDiscountPercent: pricing.promoDiscountPercent,
              promoStartDate: pricing.promoStartDate ? new Date(pricing.promoStartDate) : undefined,
              promoEndDate: pricing.promoEndDate ? new Date(pricing.promoEndDate) : undefined,
              promoLabelEs: pricing.promoLabelEs,
              promoLabelEn: pricing.promoLabelEn,
            },
          },
          includes: {
            create: [
              ...includes.map((inc, i) => ({ type: "INCLUDE", textEs: inc.textEs, textEn: inc.textEn, sortOrder: i })),
              ...excludes.map((exc, i) => ({ type: "EXCLUDE", textEs: exc.textEs, textEn: exc.textEn, sortOrder: i })),
            ],
          },
          images: {
            create: images.map((img, i) => ({
              cloudinaryId: img.cloudinaryId,
              url: img.url,
              altEs: img.altEs,
              altEn: img.altEn,
              isPrimary: img.isPrimary,
              sortOrder: i,
            })),
          },
          departures: {
            create: departures.map((dep) => ({
              departureDate: new Date(dep.departureDate),
              maxCapacity: dep.maxCapacity,
            })),
          },
        },
      });

      return tour;
    }),

  // Actualizar tour
  update: adminOrMarketing
    .input(tourUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, itinerary, pricing, includes, excludes, images, departures, ...tourData } = input;

      const existing = await ctx.db.tour.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      // Verificar slug unico si cambio
      if (tourData.slug && tourData.slug !== existing.slug) {
        const slugExists = await ctx.db.tour.findUnique({ where: { slug: tourData.slug } });
        if (slugExists) {
          throw new TRPCError({ code: "CONFLICT", message: "Ya existe un tour con ese slug" });
        }
      }

      // Actualizar tour base
      await ctx.db.tour.update({ where: { id }, data: tourData });

      // Recrear relaciones si se proporcionan
      if (itinerary) {
        await ctx.db.itineraryDay.deleteMany({ where: { tourId: id } });
        await ctx.db.itineraryDay.createMany({
          data: itinerary.map((day) => ({ tourId: id, ...day })),
        });
      }

      if (pricing) {
        await ctx.db.tourPricing.upsert({
          where: { tourId: id },
          create: {
            tourId: id,
            basePricePenAdult: pricing.basePricePenAdult!,
            basePriceUsdAdult: pricing.basePriceUsdAdult!,
            basePricePenChild: pricing.basePricePenChild!,
            basePriceUsdChild: pricing.basePriceUsdChild!,
            groupDiscountPercent: pricing.groupDiscountPercent,
            groupMinPersons: pricing.groupMinPersons,
          },
          update: {
            basePricePenAdult: pricing.basePricePenAdult,
            basePriceUsdAdult: pricing.basePriceUsdAdult,
            basePricePenChild: pricing.basePricePenChild,
            basePriceUsdChild: pricing.basePriceUsdChild,
            groupDiscountPercent: pricing.groupDiscountPercent,
            groupMinPersons: pricing.groupMinPersons,
          },
        });
      }

      if (includes || excludes) {
        await ctx.db.tourInclude.deleteMany({ where: { tourId: id } });
        const allIncludes = [
          ...(includes || []).map((inc, i) => ({ tourId: id, type: "INCLUDE", textEs: inc.textEs, textEn: inc.textEn, sortOrder: i })),
          ...(excludes || []).map((exc, i) => ({ tourId: id, type: "EXCLUDE", textEs: exc.textEs, textEn: exc.textEn, sortOrder: i })),
        ];
        if (allIncludes.length > 0) {
          await ctx.db.tourInclude.createMany({ data: allIncludes });
        }
      }

      if (images) {
        await ctx.db.tourImage.deleteMany({ where: { tourId: id } });
        if (images.length > 0) {
          await ctx.db.tourImage.createMany({
            data: images.map((img, i) => ({
              tourId: id,
              cloudinaryId: img.cloudinaryId,
              url: img.url,
              altEs: img.altEs,
              altEn: img.altEn,
              isPrimary: img.isPrimary,
              sortOrder: i,
            })),
          });
        }
      }

      if (departures) {
        await ctx.db.tourDeparture.deleteMany({ where: { tourId: id } });
        if (departures.length > 0) {
          await ctx.db.tourDeparture.createMany({
            data: departures.map((dep) => ({
              tourId: id,
              departureDate: new Date(dep.departureDate),
              maxCapacity: dep.maxCapacity,
            })),
          });
        }
      }

      return ctx.db.tour.findUnique({
        where: { id },
        include: {
          images: true,
          itinerary: true,
          pricing: true,
          includes: true,
          departures: true,
        },
      });
    }),

  // Eliminar tour (solo admin)
  delete: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({ where: { id: input.id } });
      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      await ctx.db.tour.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Toggle publicar/despublicar
  togglePublish: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({ where: { id: input.id } });
      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      const newStatus = tour.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      return ctx.db.tour.update({
        where: { id: input.id },
        data: { status: newStatus },
      });
    }),

  // Toggle destacado
  toggleFeatured: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({ where: { id: input.id } });
      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      return ctx.db.tour.update({
        where: { id: input.id },
        data: { isFeatured: !tour.isFeatured },
      });
    }),
});
