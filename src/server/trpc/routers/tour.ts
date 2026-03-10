import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
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
import { Decimal } from "@prisma/client/runtime/library";
import { CACHE_TAGS } from "@/server/lib/cache";

function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Decimal) return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeDecimals) as unknown as T;
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const key of Object.keys(obj as any)) {
      result[key] = serializeDecimals((obj as any)[key]);
    }
    return result as T;
  }
  return obj;
}

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
        isActive: true,
        ...(status && { status }),
        ...(input.tourType && { tourType: input.tourType }),
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
            pricing: { select: { basePriceUsdAdult: true } },
            _count: { select: { reservations: true, departures: true } },
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

  // Guardar borrador (auto-save)
  saveDraft: adminOrMarketing
    .input(tourUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, itinerary, pricing, includes, excludes, images, departures, ...tourData } = input;
      const existing = await ctx.db.tour.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }
      return ctx.db.tour.update({ where: { id }, data: tourData });
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
      const tour = await ctx.db.tour.findFirst({
        where: { slug: input.slug, status: "PUBLISHED", isActive: true },
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
          itinerary: itinerary.length > 0 ? {
            create: itinerary.map((day) => ({
              dayNumber: day.dayNumber,
              titleEs: day.titleEs,
              titleEn: day.titleEn,
              descriptionEs: day.descriptionEs,
              descriptionEn: day.descriptionEn,
            })),
          } : undefined,
          ...(pricing ? {
            pricing: {
              create: {
                basePriceUsdAdult: pricing.basePriceUsdAdult,
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
          } : {}),
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

      revalidateTag(CACHE_TAGS.tours);
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

      // Wrap all mutations in a transaction for atomicity
      const result = await ctx.db.$transaction(async (tx) => {
        // Verificar slug unico DENTRO de la transacción para evitar race conditions
        if (tourData.slug && tourData.slug !== existing.slug) {
          const slugExists = await tx.tour.findUnique({ where: { slug: tourData.slug } });
          if (slugExists) {
            throw new TRPCError({ code: "CONFLICT", message: "Ya existe un tour con ese slug" });
          }
        }

        // Prevent changing BOOKABLE → INFORMATIONAL if there are active reservations
        if (tourData.tourType === "INFORMATIONAL" && existing.tourType === "BOOKABLE") {
          const activeReservations = await tx.reservation.count({
            where: { tourId: id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
          });
          if (activeReservations > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `No se puede cambiar a informativo: hay ${activeReservations} reserva(s) activa(s)`,
            });
          }
        }

        // Actualizar tour base
        await tx.tour.update({ where: { id }, data: tourData });

        // Recrear relaciones si se proporcionan
        if (itinerary) {
          await tx.itineraryDay.deleteMany({ where: { tourId: id } });
          await tx.itineraryDay.createMany({
            data: itinerary.map((day) => ({ tourId: id, ...day })),
          });
        }

        if (pricing === null) {
          await tx.tourPricing.deleteMany({ where: { tourId: id } });
        } else if (pricing) {
          await tx.tourPricing.upsert({
            where: { tourId: id },
            create: {
              tourId: id,
              basePriceUsdAdult: pricing.basePriceUsdAdult,
              basePriceUsdChild: pricing.basePriceUsdChild,
              groupDiscountPercent: pricing.groupDiscountPercent,
              groupMinPersons: pricing.groupMinPersons,
            },
            update: {
              basePriceUsdAdult: pricing.basePriceUsdAdult,
              basePriceUsdChild: pricing.basePriceUsdChild,
              groupDiscountPercent: pricing.groupDiscountPercent,
              groupMinPersons: pricing.groupMinPersons,
            },
          });
        }

        if (includes || excludes) {
          await tx.tourInclude.deleteMany({ where: { tourId: id } });
          const allIncludes = [
            ...(includes || []).map((inc, i) => ({ tourId: id, type: "INCLUDE", textEs: inc.textEs, textEn: inc.textEn, sortOrder: i })),
            ...(excludes || []).map((exc, i) => ({ tourId: id, type: "EXCLUDE", textEs: exc.textEs, textEn: exc.textEn, sortOrder: i })),
          ];
          if (allIncludes.length > 0) {
            await tx.tourInclude.createMany({ data: allIncludes });
          }
        }

        if (images) {
          await tx.tourImage.deleteMany({ where: { tourId: id } });
          if (images.length > 0) {
            await tx.tourImage.createMany({
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
          // Only delete departures WITHOUT reservations to prevent FK violations
          const departuresWithReservations = await tx.tourDeparture.findMany({
            where: { tourId: id },
            include: { _count: { select: { reservations: true } } },
          });

          const toDelete = departuresWithReservations
            .filter((d) => d._count.reservations === 0)
            .map((d) => d.id);

          const protected_ = departuresWithReservations
            .filter((d) => d._count.reservations > 0);

          if (toDelete.length > 0) {
            await tx.tourDeparture.deleteMany({
              where: { id: { in: toDelete } },
            });
          }

          // Create new departures (skip dates that are already protected)
          const protectedDates = new Set(
            protected_.map((d) => d.departureDate.toISOString().split("T")[0])
          );

          const newDepartures = departures.filter(
            (dep) => !protectedDates.has(new Date(dep.departureDate).toISOString().split("T")[0])
          );

          if (newDepartures.length > 0) {
            await tx.tourDeparture.createMany({
              data: newDepartures.map((dep) => ({
                tourId: id,
                departureDate: new Date(dep.departureDate),
                maxCapacity: dep.maxCapacity,
              })),
            });
          }
        }

        return tx.tour.findUnique({
          where: { id },
          include: {
            images: true,
            itinerary: true,
            pricing: true,
            includes: true,
            departures: true,
          },
        });
      });

      revalidateTag(CACHE_TAGS.tours);
      return result;
    }),

  // Eliminar tour (solo admin)
  delete: adminOnly
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({ where: { id: input.id } });
      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      // Aplicamos Soft Delete (Borrado Lógico) para proteger la integridad contable
      // de las reservas y cotizaciones históricas asociadas a este tour.
      await ctx.db.tour.update({
        where: { id: input.id },
        data: {
          isActive: false,
          status: "ARCHIVED"
        }
      });
      revalidateTag(CACHE_TAGS.tours);
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
      const result = await ctx.db.tour.update({
        where: { id: input.id },
        data: { status: newStatus },
      });
      revalidateTag(CACHE_TAGS.tours);
      return result;
    }),

  // Toggle destacado
  toggleFeatured: adminOrMarketing
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tour = await ctx.db.tour.findUnique({ where: { id: input.id } });
      if (!tour) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }

      const result = await ctx.db.tour.update({
        where: { id: input.id },
        data: { isFeatured: !tour.isFeatured },
      });
      revalidateTag(CACHE_TAGS.tours);
      return result;
    }),
});
