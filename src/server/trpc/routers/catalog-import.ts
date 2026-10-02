import { z } from "zod";
import { router, roleProtectedProcedure } from "../trpc";
import { assertCatalogImportEnabled, assertCatalogImportSecret } from "@/server/catalog-import/access";
import { catalogExtractionSchema } from "@/server/catalog-import/schemas";
import { validateCatalogTour } from "@/server/catalog-import/validator";
import { findDuplicateMatches } from "@/server/catalog-import/duplicates";
import { TRPCError } from "@trpc/server";

const developerProcedure = roleProtectedProcedure(["DEVELOPER", "ADMIN"]);

export const catalogImportRouter = router({
  access: developerProcedure
    .input(z.object({ secret: z.string().min(1).max(256) }))
    .mutation(async ({ ctx, input }) => {
      assertCatalogImportEnabled();
      assertCatalogImportSecret(input.secret);
      return { success: true, userId: ctx.user.id };
    }),

  status: developerProcedure.query(async () => {
    assertCatalogImportEnabled();
    return { enabled: true };
  }),

  history: developerProcedure
    .input(z.object({
      secret: z.string().min(1).max(256),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      assertCatalogImportSecret(input.secret);
      return ctx.db.catalogImport.findMany({
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          filename: true,
          status: true,
          totalTours: true,
          readyCount: true,
          reviewCount: true,
          duplicateCount: true,
          createdCount: true,
          createdAt: true,
          tours: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              status: true,
              sourceDocument: true,
              sourcePages: true,
              tourDataJson: true,
              existingTourId: true,
              createdTourId: true,
              confidence: true,
              issues: { where: { resolved: false }, select: { type: true, field: true, reason: true } },
            },
          },
        },
      });
    }),

  validateCandidate: developerProcedure
    .input(z.object({ secret: z.string().min(1).max(256), candidate: z.unknown() }))
    .mutation(async ({ input }) => {
      assertCatalogImportSecret(input.secret);
      const candidate = catalogExtractionSchema.shape.tours.element.parse(input.candidate);
      const issues = validateCatalogTour(candidate);
      return {
        status: issues.length > 0 ? "NEEDS_REVIEW" as const : "READY" as const,
        issues,
      };
    }),

  updateCandidate: developerProcedure
    .input(z.object({
      secret: z.string().min(1).max(256),
      importTourId: z.string().cuid(),
      candidate: z.unknown(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertCatalogImportSecret(input.secret);
      const candidate = catalogExtractionSchema.shape.tours.element.parse(input.candidate);
      const importTour = await ctx.db.catalogImportTour.findUnique({
        where: { id: input.importTourId },
        select: { id: true, importId: true, existingTourId: true, createdTourId: true },
      });
      if (!importTour) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato no encontrado." });
      if (importTour.existingTourId || importTour.createdTourId) {
        throw new TRPCError({ code: "CONFLICT", message: "No se puede editar un candidato ya asociado a un tour." });
      }

      const issues = validateCatalogTour(candidate);
      const duplicates = await findDuplicateMatches(ctx.db, candidate);
      const status = duplicates.length > 0
        ? "DUPLICATE"
        : issues.length > 0
          ? "NEEDS_REVIEW"
          : "READY";

      await ctx.db.$transaction(async (tx) => {
        await tx.catalogImportTour.update({
          where: { id: importTour.id },
          data: {
            tourDataJson: candidate,
            sourceDocument: candidate.sourceDocument,
            sourcePages: candidate.sourcePages,
            status,
            existingTourId: duplicates[0]?.tourId ?? null,
            confidence: duplicates.length > 0 ? duplicates[0].score : issues.length > 0 ? 0.5 : 0.9,
          },
        });
        await tx.importIssue.deleteMany({ where: { importTourId: importTour.id } });
        await tx.importIssue.createMany({
          data: [
            ...issues.map((issue) => ({
              importTourId: importTour.id,
              type: issue.type,
              field: issue.field,
              reason: issue.reason,
              sourcePages: issue.sourcePages,
            })),
            ...duplicates.slice(0, 3).map((match) => ({
              importTourId: importTour.id,
              type: "POSSIBLE_DUPLICATE" as const,
              field: "tour",
              valueA: match.tourId,
              reason: match.reasons.join(" "),
              sourcePages: candidate.sourcePages,
            })),
          ],
        });
        const counts = await tx.catalogImportTour.groupBy({
          by: ["status"],
          where: { importId: importTour.importId },
          _count: true,
        });
        const count = (status: string) => counts.find((item) => item.status === status)?._count ?? 0;
        await tx.catalogImport.update({
          where: { id: importTour.importId },
          data: {
            readyCount: count("READY"),
            duplicateCount: count("DUPLICATE"),
            reviewCount: count("NEEDS_REVIEW"),
            blockedCount: count("BLOCKED"),
          },
        });
      }, { timeout: 15_000, maxWait: 10_000 });

      return { status, issues, duplicateMatches: duplicates };
    }),

  duplicateMatches: developerProcedure
    .input(z.object({ secret: z.string().min(1).max(256), candidate: z.unknown() }))
    .query(async ({ ctx, input }) => {
      assertCatalogImportSecret(input.secret);
      const candidate = catalogExtractionSchema.shape.tours.element.parse(input.candidate);
      return findDuplicateMatches(ctx.db, candidate);
    }),

  createDraft: developerProcedure
    .input(z.object({
      secret: z.string().min(1).max(256),
      importTourId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      assertCatalogImportSecret(input.secret);
      const importTour = await ctx.db.catalogImportTour.findUnique({
        where: { id: input.importTourId },
      });
      if (!importTour) throw new TRPCError({ code: "NOT_FOUND", message: "Candidato no encontrado." });
      if (importTour.status !== "READY") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "El candidato no está listo para crear un borrador." });
      }
      if (importTour.existingTourId || importTour.createdTourId) {
        throw new TRPCError({ code: "CONFLICT", message: "El candidato ya tiene una coincidencia o borrador asociado." });
      }

      const candidate = catalogExtractionSchema.shape.tours.element.parse(importTour.tourDataJson);
      const validationIssues = validateCatalogTour(candidate);
      if (validationIssues.length > 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "El candidato requiere revisión antes de crear el borrador." });
      }

      const slug = candidate.slug ?? `import-${importTour.id}`;
      const existingSlug = await ctx.db.tour.findUnique({ where: { slug }, select: { id: true } });
      if (existingSlug) {
        throw new TRPCError({ code: "CONFLICT", message: "El slug ya existe en otro tour." });
      }

      const created = await ctx.db.$transaction(async (tx) => {
        const tour = await tx.tour.create({
          data: {
            slug,
            status: "DRAFT",
            category: candidate.category!,
            destination: candidate.destination!,
            difficulty: candidate.difficulty ?? "EASY",
            durationDays: candidate.durationDays!,
            durationNights: candidate.durationNights!,
            durationHours: candidate.durationHours,
            nameEs: candidate.nameEs!,
            nameEn: candidate.nameEn!,
            shortDescEs: candidate.shortDescEs!,
            shortDescEn: candidate.shortDescEn!,
            longDescEs: candidate.longDescEs!,
            longDescEn: candidate.longDescEn!,
            metaTitleEs: candidate.metaTitleEs,
            metaDescEs: candidate.metaDescEs,
            metaTitleEn: candidate.metaTitleEn,
            metaDescEn: candidate.metaDescEn,
            itinerary: {
              create: candidate.itinerary.map((day) => ({
                dayNumber: day.dayNumber,
                titleEs: day.titleEs ?? `Día ${day.dayNumber}`,
                titleEn: day.titleEn ?? `Day ${day.dayNumber}`,
                descriptionEs: day.descriptionEs ?? "",
                descriptionEn: day.descriptionEn ?? "",
              })),
            },
            pricing: candidate.prices.length > 0 ? {
              create: {
                basePriceUsdAdult: candidate.prices.find((price) => price.amount !== null)?.amount ?? 0,
                basePriceUsdChild: 0,
                tiers: {
                  create: candidate.prices.map((price, index) => ({
                    labelEs: price.labelEs ?? `Tarifa ${index + 1}`,
                    labelEn: price.labelEn ?? `Rate ${index + 1}`,
                    ageMin: price.ageMin,
                    ageMax: price.ageMax,
                    priceUsd: price.amount!,
                    isDefault: index === 0,
                    sortOrder: index,
                  })),
                },
              },
            } : undefined,
            includes: {
              create: [
                ...candidate.includesEs.map((textEs, index) => ({
                  type: "INCLUDE", textEs, textEn: candidate.includesEn[index] ?? textEs, sortOrder: index,
                })),
                ...candidate.excludesEs.map((textEs, index) => ({
                  type: "EXCLUDE", textEs, textEn: candidate.excludesEn[index] ?? textEs, sortOrder: index,
                })),
              ],
            },
          },
        });
        await tx.catalogImportTour.update({
          where: { id: importTour.id },
          data: { status: "DRAFT_CREATED", createdTourId: tour.id },
        });
        await tx.catalogImport.update({
          where: { id: importTour.importId },
          data: { createdCount: { increment: 1 } },
        });
        return tour;
      });

      return { id: created.id, status: created.status };
    }),
});
