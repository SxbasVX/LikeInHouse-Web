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
import { CACHE_TAGS } from "@/server/lib/cache";
import {
  TOUR_DESTINATIONS_KEY,
  assertValidDestination,
  getTourDestinations,
  normalizeDestinationList,
} from "@/server/lib/tour-destinations";
import { TOUR_CATEGORIES_KEY, assertValidCategories, getTourCategories } from "@/server/lib/tour-categories";
import { splitCategories } from "@/lib/tour-categories";
import { serializeDecimals } from "@/server/lib/serialize";

const adminOrMarketing = roleProtectedProcedure(["ADMIN", "MARKETING"]);
const adminOnly = roleProtectedProcedure(["ADMIN"]);

// Guardar un tour reescribe itinerario, tarifas, servicios, condiciones, fotos y salidas: más de una docena de
// consultas seguidas. Con la base en otra región, los 5 s por defecto de Prisma no alcanzan.
const TOUR_TRANSACTION_OPTIONS = { timeout: 20_000, maxWait: 10_000 };

// El formulario envía el tour completo en cada guardado. Una sección que llega igual a la guardada no se reescribe:
// así, subir una foto sólo toca las fotos. Ante la duda (cualquier diferencia) se reescribe.
const sameRows = (incoming: unknown[], stored: unknown[]) => JSON.stringify(incoming) === JSON.stringify(stored);

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
        ...(input.destination && { destination: input.destination }),
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
            pricing: {
              select: {
                basePriceUsdAdult: true,
                tiers: {
                  where: { isDefault: true },
                  take: 1,
                  select: { priceUsd: true, isDefault: true },
                },
              },
            },
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

  // Ciudades disponibles para el campo Destino
  destinations: protectedProcedure.query(async ({ ctx }) => getTourDestinations(ctx.db)),

  // Cantidad de tours por ciudad (incluye destinos que ya no están en la lista)
  destinationSummary: protectedProcedure.query(async ({ ctx }) => {
    const [destinations, groups] = await Promise.all([
      getTourDestinations(ctx.db),
      ctx.db.tour.groupBy({
        by: ["destination", "status"],
        where: { isActive: true },
        _count: { _all: true },
      }),
    ]);

    const summary = new Map<string, { destination: string; total: number; published: number; draft: number; inList: boolean }>();
    for (const destination of destinations) {
      summary.set(destination, { destination, total: 0, published: 0, draft: 0, inList: true });
    }
    for (const group of groups) {
      const row = summary.get(group.destination)
        ?? { destination: group.destination, total: 0, published: 0, draft: 0, inList: false };
      row.total += group._count._all;
      if (group.status === "PUBLISHED") row.published += group._count._all;
      if (group.status === "DRAFT") row.draft += group._count._all;
      summary.set(group.destination, row);
    }
    return [...summary.values()];
  }),

  setDestinations: adminOrMarketing
    .input(z.object({ destinations: z.array(z.string().max(60)).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const destinations = normalizeDestinationList(input.destinations);
      const removed = (await getTourDestinations(ctx.db)).filter((d) => !destinations.includes(d));
      if (removed.length > 0) {
        const inUse = await ctx.db.tour.findMany({
          where: { isActive: true, destination: { in: removed } },
          select: { destination: true },
          distinct: ["destination"],
        });
        if (inUse.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No se puede quitar ${inUse.map((t) => `"${t.destination}"`).join(", ")}: todavía tiene tours. Cámbialos de ciudad primero.`,
          });
        }
      }
      await ctx.db.setting.upsert({
        where: { key: TOUR_DESTINATIONS_KEY },
        create: { key: TOUR_DESTINATIONS_KEY, value: destinations },
        update: { value: destinations },
      });
      // The quote form lists these cities.
      revalidateTag(CACHE_TAGS.tours);
      return destinations;
    }),

  // Categorías oficiales y cuántos tours usan cada una
  categories: protectedProcedure.query(async ({ ctx }) => {
    const [categories, tours] = await Promise.all([
      getTourCategories(ctx.db),
      ctx.db.tour.findMany({ where: { isActive: true }, select: { category: true } }),
    ]);
    const counts: Record<string, number> = {};
    for (const tour of tours) {
      for (const c of splitCategories(tour.category)) counts[c] = (counts[c] ?? 0) + 1;
    }
    return { categories, counts };
  }),

  setCategories: adminOrMarketing
    .input(z.object({ categories: z.array(z.string().max(40)).min(1).max(30) }))
    .mutation(async ({ ctx, input }) => {
      const categories = normalizeDestinationList(input.categories);
      const removed = (await getTourCategories(ctx.db)).filter((c) => !categories.includes(c));
      if (removed.length > 0) {
        const tours = await ctx.db.tour.findMany({ where: { isActive: true }, select: { category: true } });
        const inUse = removed.filter((c) => tours.some((t) => splitCategories(t.category).includes(c)));
        if (inUse.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No se puede quitar ${inUse.map((c) => `"${c}"`).join(", ")}: todavía tiene tours. Quítala de esos tours primero.`,
          });
        }
      }
      await ctx.db.setting.upsert({
        where: { key: TOUR_CATEGORIES_KEY },
        create: { key: TOUR_CATEGORIES_KEY, value: categories },
        update: { value: categories },
      });
      revalidateTag(CACHE_TAGS.tours);
      return categories;
    }),

  // Guardar borrador (auto-save)
  saveDraft: adminOrMarketing
    .input(tourUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, itinerary, pricing, includes, excludes, conditions, images, departures, ...tourData } = input;
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
          pricing: {
            include: { tiers: { orderBy: { sortOrder: "asc" } } },
          },
          includes: { orderBy: { sortOrder: "asc" } },
          conditions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
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
          pricing: {
            include: { tiers: { orderBy: { sortOrder: "asc" } } },
          },
          includes: { orderBy: { sortOrder: "asc" } },
          conditions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
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
      const { itinerary, pricing, includes, excludes, conditions, images, departures, ...tourData } = input;
      await assertValidDestination(ctx.db, tourData.destination);
      await assertValidCategories(ctx.db, tourData.category);

      // Wrap in transaction to ensure atomicity (tour + all relations)
      const tour = await ctx.db.$transaction(async (tx) => {
        const existing = await tx.tour.findUnique({ where: { slug: tourData.slug } });
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Ya existe un tour con ese slug" });
        }

        return tx.tour.create({
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
                  groupDiscountPercent: pricing.groupDiscountPercent,
                  groupMinPersons: pricing.groupMinPersons,
                  promoDiscountPercent: pricing.promoDiscountPercent,
                  promoStartDate: pricing.promoStartDate ? new Date(pricing.promoStartDate) : undefined,
                  promoEndDate: pricing.promoEndDate ? new Date(pricing.promoEndDate) : undefined,
                  promoLabelEs: pricing.promoLabelEs,
                  promoLabelEn: pricing.promoLabelEn,
                  tiers: {
                    create: pricing.tiers.map((tier, i) => ({
                      labelEs: tier.labelEs,
                      labelEn: tier.labelEn,
                      ageMin: tier.ageMin ?? null,
                      ageMax: tier.ageMax ?? null,
                      priceUsd: tier.priceUsd,
                      isDefault: tier.isDefault,
                      sortOrder: i,
                    })),
                  },
                },
              },
            } : {}),
            includes: {
              create: [
                ...includes.map((inc, i) => ({ type: "INCLUDE", textEs: inc.textEs, textEn: inc.textEn, sortOrder: i })),
                ...excludes.map((exc, i) => ({ type: "EXCLUDE", textEs: exc.textEs, textEn: exc.textEn, sortOrder: i })),
              ],
            },
            conditions: conditions.length > 0 ? {
              create: conditions.map((c, i) => ({
                type: c.type,
                textEs: c.textEs,
                textEn: c.textEn,
                isActive: c.isActive,
                sortOrder: i,
              })),
            } : undefined,
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
      }, TOUR_TRANSACTION_OPTIONS);

      revalidateTag(CACHE_TAGS.tours);
      return tour;
    }),

  // Actualizar tour
  update: adminOrMarketing
    .input(tourUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, itinerary, pricing, includes, excludes, conditions, images, departures, ...tourData } = input;

      const existing = await ctx.db.tour.findUnique({
        where: { id },
        include: {
          itinerary: { orderBy: { dayNumber: "asc" } },
          includes: { orderBy: { sortOrder: "asc" } },
          conditions: { orderBy: { sortOrder: "asc" } },
          images: { orderBy: { sortOrder: "asc" } },
          pricing: { include: { tiers: { orderBy: { sortOrder: "asc" } } } },
        },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tour no encontrado" });
      }
      const textRows = (rows: Array<{ textEs: string; textEn: string }>) => rows.map((r) => ({ textEs: r.textEs, textEn: r.textEn }));
      const itineraryRows = (rows: NonNullable<typeof itinerary>) => [...rows].sort((a, b) => a.dayNumber - b.dayNumber)
        .map((d) => ({ dayNumber: d.dayNumber, titleEs: d.titleEs, titleEn: d.titleEn, descriptionEs: d.descriptionEs, descriptionEn: d.descriptionEn }));
      const unchanged = {
        itinerary: Boolean(itinerary) && sameRows(itineraryRows(itinerary!), itineraryRows(existing.itinerary)),
        includes: sameRows(textRows(includes ?? []), textRows(existing.includes.filter((r) => r.type === "INCLUDE")))
          && sameRows(textRows(excludes ?? []), textRows(existing.includes.filter((r) => r.type === "EXCLUDE"))),
        conditions: Boolean(conditions) && sameRows(
          conditions!.map((c) => ({ type: c.type, textEs: c.textEs, textEn: c.textEn, isActive: c.isActive })),
          existing.conditions.map((c) => ({ type: c.type, textEs: c.textEs, textEn: c.textEn, isActive: c.isActive }))),
        images: Boolean(images) && sameRows(
          images!.map((i) => ({ cloudinaryId: i.cloudinaryId, url: i.url, altEs: i.altEs ?? null, altEn: i.altEn ?? null, isPrimary: i.isPrimary })),
          existing.images.map((i) => ({ cloudinaryId: i.cloudinaryId, url: i.url, altEs: i.altEs, altEn: i.altEn, isPrimary: i.isPrimary }))),
        tiers: Boolean(pricing && existing.pricing) && sameRows(
          pricing!.tiers.map((t) => ({ labelEs: t.labelEs, labelEn: t.labelEn, ageMin: t.ageMin ?? null, ageMax: t.ageMax ?? null, priceUsd: t.priceUsd, isDefault: t.isDefault })),
          existing.pricing!.tiers.map((t) => ({ labelEs: t.labelEs, labelEn: t.labelEn, ageMin: t.ageMin, ageMax: t.ageMax, priceUsd: Number(t.priceUsd), isDefault: t.isDefault }))),
      };
      if (tourData.destination && tourData.destination !== existing.destination) {
        await assertValidDestination(ctx.db, tourData.destination);
      }
      if (tourData.category && tourData.category !== existing.category) {
        await assertValidCategories(ctx.db, tourData.category);
      }

      // Wrap all mutations in a transaction for atomicity
      await ctx.db.$transaction(async (tx) => {
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
        if (itinerary && !unchanged.itinerary) {
          await tx.itineraryDay.deleteMany({ where: { tourId: id } });
          await tx.itineraryDay.createMany({
            data: itinerary.map((day) => ({ tourId: id, ...day })),
          });
        }

        if (pricing === null) {
          await tx.tourPricing.deleteMany({ where: { tourId: id } });
        } else if (pricing) {
          const upsertedPricing = await tx.tourPricing.upsert({
            where: { tourId: id },
            create: {
              tourId: id,
              groupDiscountPercent: pricing.groupDiscountPercent,
              groupMinPersons: pricing.groupMinPersons,
              promoDiscountPercent: pricing.promoDiscountPercent,
              promoStartDate: pricing.promoStartDate ? new Date(pricing.promoStartDate) : undefined,
              promoEndDate: pricing.promoEndDate ? new Date(pricing.promoEndDate) : undefined,
              promoLabelEs: pricing.promoLabelEs,
              promoLabelEn: pricing.promoLabelEn,
            },
            update: {
              groupDiscountPercent: pricing.groupDiscountPercent,
              groupMinPersons: pricing.groupMinPersons,
              promoDiscountPercent: pricing.promoDiscountPercent,
              promoStartDate: pricing.promoStartDate ? new Date(pricing.promoStartDate) : undefined,
              promoEndDate: pricing.promoEndDate ? new Date(pricing.promoEndDate) : undefined,
              promoLabelEs: pricing.promoLabelEs,
              promoLabelEn: pricing.promoLabelEn,
            },
          });

          // Recreate tiers
          if (!unchanged.tiers) await tx.tourPricingTier.deleteMany({ where: { pricingId: upsertedPricing.id } });
          if (!unchanged.tiers && pricing.tiers.length > 0) {
            await tx.tourPricingTier.createMany({
              data: pricing.tiers.map((tier, i) => ({
                pricingId: upsertedPricing.id,
                labelEs: tier.labelEs,
                labelEn: tier.labelEn,
                ageMin: tier.ageMin ?? null,
                ageMax: tier.ageMax ?? null,
                priceUsd: tier.priceUsd,
                isDefault: tier.isDefault,
                sortOrder: i,
              })),
            });
          }
        }

        if ((includes || excludes) && !unchanged.includes) {
          await tx.tourInclude.deleteMany({ where: { tourId: id } });
          const allIncludes = [
            ...(includes || []).map((inc, i) => ({ tourId: id, type: "INCLUDE", textEs: inc.textEs, textEn: inc.textEn, sortOrder: i })),
            ...(excludes || []).map((exc, i) => ({ tourId: id, type: "EXCLUDE", textEs: exc.textEs, textEn: exc.textEn, sortOrder: i })),
          ];
          if (allIncludes.length > 0) {
            await tx.tourInclude.createMany({ data: allIncludes });
          }
        }

        if (conditions && !unchanged.conditions) {
          await tx.tourCondition.deleteMany({ where: { tourId: id } });
          if (conditions.length > 0) {
            type ConditionInput = { type: "HEALTH"|"AGE"|"BEHAVIOR"|"GROUP_SIZE"|"PHYSICAL"|"GENERAL"; textEs: string; textEn: string; isActive: boolean };
            await tx.tourCondition.createMany({
              data: (conditions as ConditionInput[]).map((c, i) => ({
                tourId: id,
                type: c.type,
                textEs: c.textEs,
                textEn: c.textEn,
                isActive: c.isActive,
                sortOrder: i,
              })),
            });
          }
        }

        if (images && !unchanged.images) {
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

      }, TOUR_TRANSACTION_OPTIONS);

      // Leído fuera de la transacción: ya está confirmado y no consume su tiempo límite.
      const result = await ctx.db.tour.findUnique({
        where: { id },
        include: {
          images: true,
          itinerary: true,
          pricing: {
            include: { tiers: { orderBy: { sortOrder: "asc" } } },
          },
          includes: true,
          conditions: { orderBy: { sortOrder: "asc" } },
          departures: true,
        },
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
