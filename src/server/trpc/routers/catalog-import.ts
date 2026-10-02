import { z } from "zod";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { router, roleProtectedProcedure } from "../trpc";
import { assertCatalogImportEnabled, assertCatalogImportGrant, assertCatalogImportSecret } from "@/server/catalog-import/access";
import { CATALOG_ACCESS_COOKIE, CATALOG_ACCESS_SECONDS, createAccessGrant, createPreviewToken, verifyPreviewToken } from "@/server/catalog-import/secret";
import { catalogTourCandidateSchema } from "@/server/catalog-import/schemas";
import { validateCatalogTour } from "@/server/catalog-import/validator";
import { findDuplicateMatches } from "@/server/catalog-import/duplicates";
import { draftCreateData } from "@/server/catalog-import/draft";
import { jsonData, refreshImportCounts, createProvider, isProviderConfigured } from "@/server/catalog-import/service";
import { getProviderSelection } from "@/server/catalog-import/providers/router";
import { checkRateLimit } from "@/server/lib/rate-limit";

const developer = roleProtectedProcedure(["DEVELOPER"]);
const authorized = developer.use(async ({ ctx, next }) => {
  await assertCatalogImportGrant(ctx.user.id);
  return next({ ctx });
});
const idInput = z.object({ importTourId: z.string().cuid() });
function parseCandidate(raw: unknown) {
  const parsed = catalogTourCandidateSchema.safeParse(raw);
  if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ").slice(0, 2000) });
  return parsed.data;
}

export const catalogImportRouter = router({
  access: developer.input(z.object({ secret: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
    assertCatalogImportEnabled();
    if (!checkRateLimit(`catalog-secret:${ctx.user.id}:${ctx.ip}`, { maxRequests: 5, windowSeconds: 900 }).allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Espera 15 minutos antes de volver a intentar." });
    assertCatalogImportSecret(input.secret);
    (await cookies()).set(CATALOG_ACCESS_COOKIE, createAccessGrant(ctx.user.id), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: CATALOG_ACCESS_SECONDS,
    });
    return { success: true };
  }),
  logout: developer.mutation(async () => { (await cookies()).delete(CATALOG_ACCESS_COOKIE); return { success: true }; }),
  status: authorized.query(async ({ ctx }) => {
    const selection = getProviderSelection();
    return { enabled: true, userId: ctx.user.id, providers: [...new Set([selection.primary, selection.fallback, selection.review])].filter(isProviderConfigured).map((name) => ({ name, model: createProvider(name).model })) };
  }),
  history: authorized.input(z.object({ limit: z.number().int().min(1).max(50).default(20) })).query(async ({ ctx, input }) => {
    // Surface interrupted jobs instead of leaving PROCESSING indefinitely.
    await ctx.db.catalogImport.updateMany({
      where: { status: "PROCESSING", startedAt: { lt: new Date(Date.now() - 6 * 60_000) } },
      data: { status: "PARTIAL", lastError: "Trabajo interrumpido. Reanudar conserva los candidatos ya procesados." },
    });
    return ctx.db.catalogImport.findMany({ orderBy: { createdAt: "desc" }, take: input.limit,
      select: { id: true, filename: true, createdById: true, status: true, totalTours: true, readyCount: true, reviewCount: true,
        duplicateCount: true, blockedCount: true, createdCount: true, createdAt: true, startedAt: true,
        attempts: true, lastError: true, completedAt: true,
        tours: { orderBy: [{ sourceIndex: "asc" }, { createdAt: "asc" }],
          select: { id: true, status: true, sourceDocument: true, sourcePages: true, tourDataJson: true,
            existingTourId: true, createdTourId: true, confidence: true,
            issues: { where: { resolved: false }, select: { id: true, type: true, field: true, reason: true, valueA: true, valueB: true, sourcePages: true } },
          },
        },
        operations: { orderBy: { createdAt: "asc" }, select: { provider: true, model: true, operation: true, success: true, fallbackUsed: true, latencyMs: true, inputTokens: true, outputTokens: true, estimatedCost: true, error: true } },
      },
    });
  }),
  preview: authorized.input(idInput).query(async ({ ctx, input }) => {
    const record = await ctx.db.catalogImportTour.findUnique({ where: { id: input.importTourId }, include: { issues: { where: { resolved: false } } } });
    if (!record) throw new TRPCError({ code: "NOT_FOUND" });
    const parsed = catalogTourCandidateSchema.safeParse(record.tourDataJson);
    return { record, candidate: parsed.success ? parsed.data : null,
      validation: parsed.success ? validateCatalogTour(parsed.data) : [],
      duplicateMatches: parsed.success ? await findDuplicateMatches(ctx.db, parsed.data) : [],
      previewToken: createPreviewToken(ctx.user.id, record.id, record.tourDataJson),
    };
  }),
  validateCandidate: authorized.input(z.object({ candidate: z.unknown() })).mutation(async ({ input }) => {
    const issues = validateCatalogTour(parseCandidate(input.candidate));
    return { status: issues.length ? "NEEDS_REVIEW" as const : "READY" as const, issues };
  }),
  updateCandidate: authorized.input(idInput.extend({ candidate: z.unknown(), reviewNote: z.string().trim().min(10).max(2000), confirmedFields: z.array(z.string()).max(100).default([]) })).mutation(async ({ ctx, input }) => {
    const candidate = parseCandidate(input.candidate);
    const result = await ctx.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${input.importTourId} FOR UPDATE`;
      const record = await tx.catalogImportTour.findUnique({ where: { id: input.importTourId } });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (record.createdTourId || record.status === "DRAFT_CREATED") throw new TRPCError({ code: "CONFLICT", message: "El borrador ya fue creado; usa el formulario habitual para editarlo." });
      candidate.sourceDocument = record.sourceDocument;
      if (record.sourcePages.length) candidate.sourcePages = record.sourcePages;
      const previous = catalogTourCandidateSchema.safeParse(record.tourDataJson);
      // Existing provenance stays unchanged until the reviewer explicitly confirms the field.
      candidate.provenance = previous.success ? { ...previous.data.provenance } : {};
      for (const field of ["category", "difficulty", "destination", "durationDays", "durationNights", "durationHours", "prices", "schedule"] as const) {
        if (!previous.success || JSON.stringify(previous.data[field]) !== JSON.stringify(candidate[field])) {
          candidate.provenance[field] = { source: "manual", requiresReview: false, sourcePages: candidate.sourcePages, evidence: input.reviewNote };
        }
      }
      for (const field of input.confirmedFields) candidate.provenance[field] = {
        source: "manual", requiresReview: false, sourcePages: candidate.sourcePages, evidence: input.reviewNote,
      };
      const issues = validateCatalogTour(candidate), duplicates = await findDuplicateMatches(tx, candidate);
      const status = duplicates.length ? "DUPLICATE" : issues.length ? "NEEDS_REVIEW" : "READY";
      await tx.catalogImportTour.update({ where: { id: record.id }, data: {
        tourDataJson: jsonData(candidate), sourcePages: candidate.sourcePages, status,
        existingTourId: duplicates[0]?.tourId ?? null, confidence: duplicates[0]?.score ?? null,
      } });
      await tx.importIssue.updateMany({ where: { importTourId: record.id, resolved: false }, data: { resolved: true, resolvedAt: new Date(), resolvedById: ctx.user.id } });
      await tx.importIssue.createMany({ data: [
        ...issues.map((issue) => ({ ...issue, importTourId: record.id })),
        ...duplicates.slice(0, 3).map((d) => ({ importTourId: record.id, type: "POSSIBLE_DUPLICATE" as const, field: "tour", valueA: d.tourId, valueB: String(d.score), reason: d.reasons.join(" "), sourcePages: candidate.sourcePages })),
        { importTourId: record.id, type: "DATA_REVIEW" as const, field: "manual_review", reason: input.reviewNote, sourcePages: candidate.sourcePages, resolved: true, resolvedAt: new Date(), resolvedById: ctx.user.id },
      ] });
      return { status, issues, duplicateMatches: duplicates, importId: record.importId };
    }, { timeout: 15_000, maxWait: 10_000 });
    await refreshImportCounts(result.importId);
    return result;
  }),
  skipCandidate: authorized.input(idInput.extend({ reason: z.string().trim().min(10).max(2000) })).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.catalogImportTour.updateMany({ where: { id: input.importTourId, createdTourId: null, status: { not: "DRAFT_CREATED" } }, data: { status: "BLOCKED" } });
    if (!result.count) throw new TRPCError({ code: "CONFLICT" });
    const record = await ctx.db.catalogImportTour.findUniqueOrThrow({ where: { id: input.importTourId } });
    await ctx.db.importIssue.create({ data: { importTourId: record.id, type: "DATA_REVIEW", field: "manual_skip", reason: input.reason, sourcePages: record.sourcePages, resolved: true, resolvedById: ctx.user.id, resolvedAt: new Date() } });
    await refreshImportCounts(record.importId);
    return { success: true };
  }),
  duplicateMatches: authorized.input(z.object({ candidate: z.unknown() })).query(async ({ ctx, input }) => findDuplicateMatches(ctx.db, parseCandidate(input.candidate))),
  createDraft: authorized.input(idInput.extend({ previewToken: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.$transaction(async (tx) => {
      // Serialize importer draft creation across candidates, including concurrent requests.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(738294105)`;
      const record = await tx.catalogImportTour.findUnique({ where: { id: input.importTourId } });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (!verifyPreviewToken(input.previewToken, ctx.user.id, record.id, record.tourDataJson)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Abre nuevamente la vista previa: los datos cambiaron o la revisión venció." });
      if (record.createdTourId) return { id: record.createdTourId, status: "DRAFT" as const, importId: record.importId };
      if (record.status !== "READY" || record.existingTourId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este candidato requiere revisión." });
      const candidate = parseCandidate(record.tourDataJson);
      if (validateCatalogTour(candidate).length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Corrige las incidencias antes de crear el borrador." });
      if ((await findDuplicateMatches(tx, candidate)).length) throw new TRPCError({ code: "CONFLICT", message: "Se encontró un tour similar. Revisa el duplicado antes de continuar." });
      const claimed = await tx.catalogImportTour.updateMany({ where: { id: record.id, status: "READY", createdTourId: null }, data: { status: "VALIDATED" } });
      if (!claimed.count) throw new TRPCError({ code: "CONFLICT", message: "El candidato cambió; abre nuevamente la vista previa." });
      const tour = await tx.tour.create({ data: draftCreateData(candidate), select: { id: true, status: true } });
      await tx.catalogImportTour.update({ where: { id: record.id }, data: { status: "DRAFT_CREATED", createdTourId: tour.id } });
      return { ...tour, importId: record.importId };
    }, { timeout: 20_000, maxWait: 10_000 });
    await refreshImportCounts(result.importId);
    return { id: result.id, status: result.status };
  }),
});
