import { z } from "zod";
import { cookies } from "next/headers";
import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { advanceCatalogBatches } from "@/server/catalog-import/jobs";
import { TRPCError } from "@trpc/server";
import { Prisma, type CatalogImportTourStatus } from "@prisma/client";
import { router, roleProtectedProcedure } from "../trpc";
import { assertCatalogImportEnabled, assertCatalogImportGrant, assertCatalogImportSecret } from "@/server/catalog-import/access";
import { CATALOG_ACCESS_COOKIE, CATALOG_ACCESS_SECONDS, createAccessGrant, createPreviewToken, verifyPreviewToken } from "@/server/catalog-import/secret";
import { catalogTourCandidateSchema } from "@/server/catalog-import/schemas";
import { validateCatalogTour } from "@/server/catalog-import/validator";
import { findDuplicateMatches } from "@/server/catalog-import/duplicates";
import { draftCreateData } from "@/server/catalog-import/draft";
import { acceptOpenWarnings, currentPriceAdjustment, isStaleCandidate, officialLists, persistCandidateReview, refreshImportCounts, revalidateCandidates } from "@/server/catalog-import/service";
import { CLAUDE_MODEL, isClaudeConfigured } from "@/server/catalog-import/providers/anthropic";
import { isBlockingIssue, statusFromIssues } from "@/server/catalog-import/severity";
import { checkRateLimit } from "@/server/lib/rate-limit";
import { assertValidDestination, getTourDestinations, normalizeDestinationList, TOUR_DESTINATIONS_KEY } from "@/server/lib/tour-destinations";
import { CACHE_TAGS } from "@/server/lib/cache";
import { assertValidCategories, getTourCategories } from "@/server/lib/tour-categories";
import { CATEGORY_SEPARATOR, MAX_CATEGORIES_PER_TOUR, mapLegacyCategory } from "@/lib/tour-categories";

const developer = roleProtectedProcedure(["DEVELOPER"]);
const authorized = developer.use(async ({ ctx, next }) => {
  await assertCatalogImportGrant(ctx.user.id);
  return next({ ctx });
});
const idInput = z.object({ importTourId: z.string().cuid() });
const candidateName = (data: unknown) => {
  const value = (data as { nameEs?: unknown } | null)?.nameEs;
  return typeof value === "string" && value.trim() ? value : null;
};
// Bulk actions and background revalidation stop here and report what is left, well inside the route's time limit.
const BULK_BUDGET_MS = 40_000;
const DEFAULT_REVIEW_NOTE = "Aprobado por el revisor.";
const OPEN_FOR_REVIEW: CatalogImportTourStatus[] = ["NEEDS_REVIEW", "READY", "DUPLICATE"];
const rootField = (field: string) => field.split(".")[0];

// Creates the draft tour for a READY candidate. Shared by the single "Crear tour" and the bulk "Crear listos".
async function createDraftInTx(tx: Prisma.TransactionClient, record: { id: string; importId: string; status: string; createdTourId: string | null; existingTourId: string | null; reviewDraftAt: Date | null; tourDataJson: unknown }) {
  if (record.createdTourId) return { id: record.createdTourId, status: "DRAFT" as const, importId: record.importId };
  if (record.reviewDraftAt) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Tienes cambios sin aprobar. Apruébalos o descártalos antes de crear el tour." });
  if (record.status !== "READY" || record.existingTourId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este candidato requiere revisión." });
  const candidate = parseCandidate(record.tourDataJson);
  if (validateCatalogTour(candidate, await officialLists(tx)).some(isBlockingIssue)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Corrige las incidencias que bloquean antes de crear el borrador." });
  await assertValidDestination(tx, candidate.destination!);
  // La IA escribe la categoría libre ("Cultural y naturaleza"): se traduce a la lista oficial
  const mapped = mapLegacyCategory(candidate.category!, await getTourCategories(tx));
  if (mapped.unknown.length > 0 || mapped.categories.length === 0) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Categoría no reconocida: "${candidate.category}". Edita el candidato y elige categorías de la lista.` });
  }
  candidate.category = mapped.categories.slice(0, MAX_CATEGORIES_PER_TOUR).join(CATEGORY_SEPARATOR);
  await assertValidCategories(tx, candidate.category);
  if ((await findDuplicateMatches(tx, candidate)).length) throw new TRPCError({ code: "CONFLICT", message: "Se encontró un tour similar. Revisa el duplicado antes de continuar." });
  const claimed = await tx.catalogImportTour.updateMany({ where: { id: record.id, status: "READY", createdTourId: null }, data: { status: "VALIDATED" } });
  if (!claimed.count) throw new TRPCError({ code: "CONFLICT", message: "El candidato cambió; abre nuevamente la vista previa." });
  const tour = await tx.tour.create({ data: draftCreateData(candidate), select: { id: true, status: true } });
  await tx.catalogImportTour.update({ where: { id: record.id }, data: { status: "DRAFT_CREATED", createdTourId: tour.id } });
  return { ...tour, importId: record.importId };
}

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
    return { enabled: true, userId: ctx.user.id, providers: isClaudeConfigured() ? [{ name: "Claude", model: CLAUDE_MODEL }] : [] };
  }),
  history: authorized.input(z.object({ limit: z.number().int().min(1).max(50).default(20) })).query(async ({ ctx, input }) => {
    // Surface jobs whose batch was never submitted instead of leaving them PROCESSING indefinitely.
    await ctx.db.catalogImport.updateMany({
      where: { status: "PROCESSING", batchId: null, startedAt: { lt: new Date(Date.now() - 6 * 60_000) } },
      data: { status: "PARTIAL", lastError: "Trabajo interrumpido. Reanudar conserva los candidatos ya procesados." },
    });
    const jobs = await ctx.db.catalogImport.findMany({ orderBy: { createdAt: "desc" }, take: input.limit,
      select: { id: true, filename: true, createdById: true, status: true, totalTours: true, readyCount: true, reviewCount: true,
        duplicateCount: true, blockedCount: true, createdCount: true, createdAt: true, startedAt: true,
        attempts: true, lastError: true, completedAt: true, batchStage: true,
        tours: { orderBy: [{ sourceIndex: "asc" }, { createdAt: "asc" }],
          select: { id: true, status: true, sourceDocument: true, sourcePages: true, tourDataJson: true,
            existingTourId: true, createdTourId: true, confidence: true, reviewDraftAt: true, updatedAt: true,
            issues: { where: { resolved: false }, select: { id: true, type: true, field: true, reason: true, valueA: true, valueB: true, sourcePages: true, checkedAt: true } },
          },
        },
        operations: { orderBy: { createdAt: "asc" }, select: { provider: true, model: true, operation: true, success: true, fallbackUsed: true, latencyMs: true, inputTokens: true, outputTokens: true, estimatedCost: true, error: true } },
      },
    });
    // Candidates stored under older automatic rules are brought up to date in the background (never while Claude
    // is still working on their document, and never over a reviewer's unapproved edits).
    const stale = jobs.filter((job) => job.status !== "PROCESSING").flatMap((job) => job.tours)
      .filter((tour) => OPEN_FOR_REVIEW.includes(tour.status) && !tour.reviewDraftAt && !tour.createdTourId && isStaleCandidate(tour.tourDataJson)).map((tour) => tour.id);
    const userId = ctx.user.id;
    // While someone watches the history, finished Claude batches are collected after the response is sent.
    after(async () => {
      await advanceCatalogBatches().catch(() => undefined);
      if (stale.length) await revalidateCandidates(stale, userId, Date.now() + 20_000, true).catch(() => undefined);
    });
    return jobs;
  }),
  preview: authorized.input(idInput).query(async ({ ctx, input }) => {
    const record = await ctx.db.catalogImportTour.findUnique({ where: { id: input.importTourId }, include: {
      issues: { where: { resolved: false }, orderBy: { createdAt: "asc" } },
      import: { select: { id: true, filename: true, status: true, batchStage: true } },
    } });
    if (!record) throw new TRPCError({ code: "NOT_FOUND" });
    // Tours reviewed before warnings could be accepted: settle their status with the current rule when opened
    // (under the same row lock as setIssueChecked, so a concurrent untick can't be overwritten).
    if (["NEEDS_REVIEW", "READY"].includes(record.status) && statusFromIssues(record.issues, false) !== record.status) {
      const settled = await ctx.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${record.id} FOR UPDATE`;
        const fresh = await tx.catalogImportTour.findUniqueOrThrow({ where: { id: record.id }, select: { status: true, issues: { where: { resolved: false }, select: { type: true, field: true, reason: true, checkedAt: true } } } });
        if (!["NEEDS_REVIEW", "READY"].includes(fresh.status)) return fresh.status;
        const status = statusFromIssues(fresh.issues, false);
        if (status !== fresh.status) await tx.catalogImportTour.update({ where: { id: record.id }, data: { status } });
        return status;
      });
      if (settled !== record.status) { await refreshImportCounts(record.importId); record.status = settled; }
    }
    const parsed = catalogTourCandidateSchema.safeParse(record.tourDataJson);
    // Siblings in document order power "previous / next to review" without loading the whole history.
    const siblings = (await ctx.db.catalogImportTour.findMany({ where: { importId: record.importId }, orderBy: [{ sourceIndex: "asc" }, { createdAt: "asc" }],
      select: { id: true, status: true, tourDataJson: true } })).map((s) => ({ id: s.id, status: s.status, name: candidateName(s.tourDataJson) }));
    return { record, candidate: parsed.success ? parsed.data : null, draft: record.reviewDraftJson,
      validation: parsed.success ? validateCatalogTour(parsed.data, await officialLists(ctx.db)) : [],
      duplicateMatches: parsed.success ? await findDuplicateMatches(ctx.db, parsed.data) : [],
      previewToken: createPreviewToken(ctx.user.id, record.id, record.tourDataJson), siblings,
    };
  }),
  // Autosave of unapproved edits. Stored as-is: it may be mid-edit and invalid; approval validates it.
  saveReviewDraft: authorized.input(idInput.extend({ candidate: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
    if (JSON.stringify(input.candidate).length > 300_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "El borrador es demasiado grande." });
    const savedAt = new Date();
    const result = await ctx.db.catalogImportTour.updateMany({
      where: { id: input.importTourId, createdTourId: null, status: { notIn: ["DRAFT_CREATED", "VALIDATED"] } },
      data: { reviewDraftJson: input.candidate as Prisma.InputJsonValue, reviewDraftAt: savedAt },
    });
    if (!result.count) throw new TRPCError({ code: "CONFLICT", message: "Este tour ya fue creado; edítalo desde Tours." });
    return { savedAt };
  }),
  discardReviewDraft: authorized.input(idInput).mutation(async ({ ctx, input }) => {
    await ctx.db.catalogImportTour.update({ where: { id: input.importTourId }, data: { reviewDraftJson: Prisma.DbNull, reviewDraftAt: null } });
    return { success: true };
  }),
  // Marking a warning as seen accepts it; when nothing blocks and every warning is accepted the tour becomes READY.
  setIssueChecked: authorized.input(z.object({ issueIds: z.array(z.string().cuid()).min(1).max(50), checked: z.boolean() })).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.$transaction(async (tx) => {
      const first = await tx.importIssue.findFirst({ where: { id: { in: input.issueIds } }, select: { importTourId: true } });
      if (!first) throw new TRPCError({ code: "NOT_FOUND" });
      await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${first.importTourId} FOR UPDATE`;
      await tx.importIssue.updateMany({ where: { id: { in: input.issueIds }, importTourId: first.importTourId, resolved: false },
        data: input.checked ? { checkedAt: new Date(), checkedById: ctx.user.id } : { checkedAt: null, checkedById: null } });
      const record = await tx.catalogImportTour.findUniqueOrThrow({ where: { id: first.importTourId },
        include: { issues: { where: { resolved: false }, select: { type: true, field: true, reason: true, checkedAt: true } } } });
      if (!["NEEDS_REVIEW", "READY"].includes(record.status)) return { status: record.status, importId: record.importId };
      const status = statusFromIssues(record.issues, false);
      if (status !== record.status) await tx.catalogImportTour.update({ where: { id: record.id }, data: { status } });
      return { status, importId: record.importId };
    });
    await refreshImportCounts(result.importId);
    return { status: result.status };
  }),
  validateCandidate: authorized.input(z.object({ candidate: z.unknown() })).mutation(async ({ ctx, input }) => {
    const issues = validateCatalogTour(parseCandidate(input.candidate), await officialLists(ctx.db));
    return { status: statusFromIssues(issues, false), issues };
  }),
  // One click accepts every "verify" warning of the given tours; tours with nothing to fix become READY.
  acceptWarnings: authorized.input(z.object({ importTourIds: z.array(z.string().cuid()).min(1).max(200) })).mutation(async ({ ctx, input }) => {
    const deadline = Date.now() + BULK_BUDGET_MS, imports = new Set<string>();
    let accepted = 0, ready = 0, index = 0;
    for (; index < input.importTourIds.length && Date.now() < deadline; index++) {
      const id = input.importTourIds[index];
      const result = await ctx.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${id} FOR UPDATE`;
        if (!await tx.catalogImportTour.findUnique({ where: { id }, select: { id: true } })) return null;
        return acceptOpenWarnings(tx, id, ctx.user.id);
      });
      if (!result) continue;
      accepted += result.accepted; imports.add(result.importId);
      if (result.status === "READY") ready++;
    }
    for (const importId of imports) await refreshImportCounts(importId);
    return { accepted, ready, remaining: input.importTourIds.length - index };
  }),
  // Creates the draft tour of every READY candidate of a document. One tour failing never stops the rest.
  createReadyDrafts: authorized.input(z.object({ importId: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    const deadline = Date.now() + BULK_BUDGET_MS;
    const job = await ctx.db.catalogImport.findUnique({ where: { id: input.importId }, select: { status: true } });
    if (!job) throw new TRPCError({ code: "NOT_FOUND" });
    // Creating a tour mid-enrichment would throw away the improvement Claude is still writing for it.
    if (job.status === "PROCESSING") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Claude todavía está trabajando en este documento. Espera a que termine para crear todos los tours." });
    const ready = await ctx.db.catalogImportTour.findMany({ where: { importId: input.importId, status: "READY", createdTourId: null }, orderBy: { sourceIndex: "asc" }, select: { id: true, tourDataJson: true } });
    const failed: Array<{ name: string; message: string }> = [];
    let created = 0, index = 0;
    for (; index < ready.length && Date.now() < deadline; index++) {
      try {
        await ctx.db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(738294105)`;
          // The row lock keeps a concurrent approval from changing the data between this read and the tour's creation.
          await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${ready[index].id} FOR UPDATE`;
          const record = await tx.catalogImportTour.findUniqueOrThrow({ where: { id: ready[index].id } });
          await createDraftInTx(tx, record);
        }, { timeout: 20_000, maxWait: 10_000 });
        created++;
      } catch (error) {
        failed.push({ name: candidateName(ready[index].tourDataJson) ?? "Tour sin nombre", message: error instanceof Error ? error.message : "Error desconocido." });
      }
    }
    await refreshImportCounts(input.importId);
    return { created, failed, remaining: ready.length - index };
  }),
  // Re-applies the automatic rules to a document (after adding a city or a category, for example).
  revalidateImport: authorized.input(z.object({ importId: z.string().cuid() })).mutation(async ({ ctx, input }) => {
    const tours = await ctx.db.catalogImportTour.findMany({ where: { importId: input.importId, status: { in: OPEN_FOR_REVIEW }, createdTourId: null, reviewDraftAt: null }, select: { id: true } });
    const remaining = await revalidateCandidates(tours.map((t) => t.id), ctx.user.id, Date.now() + BULK_BUDGET_MS);
    return { revalidated: tours.length - remaining, remaining };
  }),
  // A catalog from a city the agency doesn't list yet: add it and re-check the document in one step.
  addDestination: authorized.input(z.object({ importId: z.string().cuid(), name: z.string().trim().min(2).max(60) })).mutation(async ({ ctx, input }) => {
    // Serialized: two cities added at once must both end up in the list.
    const destinations = await ctx.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(738294107)`;
      const next = normalizeDestinationList([...await getTourDestinations(tx), input.name]);
      await tx.setting.upsert({ where: { key: TOUR_DESTINATIONS_KEY }, create: { key: TOUR_DESTINATIONS_KEY, value: next }, update: { value: next } });
      return next;
    });
    // The quote form lists these cities.
    revalidateTag(CACHE_TAGS.tours);
    const tours = await ctx.db.catalogImportTour.findMany({ where: { importId: input.importId, status: { in: OPEN_FOR_REVIEW }, createdTourId: null, reviewDraftAt: null }, select: { id: true } });
    const remaining = await revalidateCandidates(tours.map((t) => t.id), ctx.user.id, Date.now() + BULK_BUDGET_MS);
    return { destinations, remaining };
  }),
  updateCandidate: authorized.input(idInput.extend({ candidate: z.unknown(), reviewNote: z.string().trim().max(2000).optional(), confirmedFields: z.array(z.string()).max(100).default([]) })).mutation(async ({ ctx, input }) => {
    const candidate = parseCandidate(input.candidate);
    const reviewNote = input.reviewNote || DEFAULT_REVIEW_NOTE;
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
      // The exchange rate and markup are server-set; only "Actualizar tipo de cambio" changes them.
      candidate.priceAdjustment = previous.success ? previous.data.priceAdjustment : undefined;
      // Duplicate confirmations only come from "No es el mismo tour".
      candidate.dismissedDuplicates = previous.success ? previous.data.dismissedDuplicates : undefined;
      const changed = (field: string) => !previous.success || JSON.stringify((previous.data as Record<string, unknown>)[field]) !== JSON.stringify((candidate as Record<string, unknown>)[field]);
      for (const field of ["category", "difficulty", "destination", "durationDays", "durationNights", "durationHours", "prices", "schedule"] as const) {
        if (changed(field)) candidate.provenance[field] = { source: "manual", requiresReview: false, sourcePages: candidate.sourcePages, evidence: reviewNote };
      }
      for (const field of input.confirmedFields) candidate.provenance[field] = {
        source: "manual", requiresReview: false, sourcePages: candidate.sourcePages, evidence: reviewNote,
      };
      // An automatic fix the reviewer edited or confirmed is settled: its note goes away.
      candidate.autoFixes = (previous.success ? previous.data.autoFixes ?? [] : [])
        .filter((fix) => !changed(rootField(fix.field)) && !input.confirmedFields.includes(fix.field) && !input.confirmedFields.includes(rootField(fix.field)));
      // Confirming a field settles the PDF contradiction recorded on it (the note says which value is right).
      if (candidate.sourceIssues?.length) candidate.sourceIssues = candidate.sourceIssues.filter((issue) => !input.confirmedFields.includes(issue.field));
      const review = await persistCandidateReview(tx, record.id, candidate, ctx.user.id, [
        { importTourId: record.id, type: "DATA_REVIEW", field: "manual_review", reason: reviewNote, sourcePages: candidate.sourcePages, resolved: true, resolvedAt: new Date(), resolvedById: ctx.user.id },
      ], { keepChecks: true });
      return { ...review, importId: record.importId };
    }, { timeout: 15_000, maxWait: 10_000 });
    await refreshImportCounts(result.importId);
    return result;
  }),
  // The reviewer confirms a flagged existing tour is a different one. Recorded with reason and author; a taken slug can't be dismissed.
  dismissDuplicate: authorized.input(idInput.extend({ tourId: z.string().min(1).max(64), reason: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const reason = input.reason || "El revisor confirmó que son tours distintos.";
    const result = await ctx.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${input.importTourId} FOR UPDATE`;
      const record = await tx.catalogImportTour.findUnique({ where: { id: input.importTourId } });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (record.createdTourId || record.status === "DRAFT_CREATED") throw new TRPCError({ code: "CONFLICT", message: "El tour ya fue creado." });
      if (record.reviewDraftAt) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aprueba o descarta tus cambios antes de descartar un duplicado." });
      const candidate = parseCandidate(record.tourDataJson);
      const match = (await findDuplicateMatches(tx, candidate)).find((m) => m.tourId === input.tourId);
      if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "Ese tour ya no figura como parecido." });
      if (!match.dismissible) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ese tour usa el mismo slug (URL): cambia el slug en General para diferenciarlo." });
      candidate.dismissedDuplicates = [...(candidate.dismissedDuplicates ?? []), { tourId: input.tourId, reason, userId: ctx.user.id, at: new Date().toISOString() }];
      const review = await persistCandidateReview(tx, record.id, candidate, ctx.user.id, [{
        importTourId: record.id, type: "DATA_REVIEW", field: "duplicate_dismissed", valueA: input.tourId, valueB: match.existing.nameEs,
        reason: `No es el mismo tour (${Math.round(match.score * 100)} % de coincidencia): ${reason}`, sourcePages: candidate.sourcePages,
        resolved: true, resolvedAt: new Date(), resolvedById: ctx.user.id,
      }], { keepChecks: true });
      return { ...review, importId: record.importId };
    }, { timeout: 15_000, maxWait: 10_000 });
    await refreshImportCounts(result.importId);
    return { status: result.status, remaining: result.duplicateMatches.length };
  }),
  // Re-prices the candidate with today's SUNAT rate and the current markup.
  refreshPriceAdjustment: authorized.input(idInput).mutation(async ({ ctx, input }) => {
    const adjustment = await currentPriceAdjustment();
    const result = await ctx.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${input.importTourId} FOR UPDATE`;
      const record = await tx.catalogImportTour.findUnique({ where: { id: input.importTourId } });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (record.createdTourId || record.status === "DRAFT_CREATED") throw new TRPCError({ code: "CONFLICT", message: "El tour ya fue creado; ajusta el precio desde Tours." });
      if (record.reviewDraftAt) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aprueba o descarta tus cambios antes de actualizar el tipo de cambio." });
      const candidate = parseCandidate(record.tourDataJson);
      candidate.priceAdjustment = adjustment;
      const review = await persistCandidateReview(tx, record.id, candidate, ctx.user.id, [], { keepChecks: true });
      return { ...review, importId: record.importId };
    }, { timeout: 15_000, maxWait: 10_000 });
    await refreshImportCounts(result.importId);
    return { status: result.status, adjustment };
  }),
  skipCandidate: authorized.input(idInput.extend({ reason: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.catalogImportTour.updateMany({ where: { id: input.importTourId, createdTourId: null, status: { not: "DRAFT_CREATED" } }, data: { status: "BLOCKED", reviewDraftJson: Prisma.DbNull, reviewDraftAt: null } });
    if (!result.count) throw new TRPCError({ code: "CONFLICT" });
    const record = await ctx.db.catalogImportTour.findUniqueOrThrow({ where: { id: input.importTourId } });
    await ctx.db.importIssue.create({ data: { importTourId: record.id, type: "DATA_REVIEW", field: "manual_skip", reason: input.reason || "Omitido por el revisor.", sourcePages: record.sourcePages, resolved: true, resolvedById: ctx.user.id, resolvedAt: new Date() } });
    await refreshImportCounts(record.importId);
    return { success: true };
  }),
  duplicateMatches: authorized.input(z.object({ candidate: z.unknown() })).query(async ({ ctx, input }) => findDuplicateMatches(ctx.db, parseCandidate(input.candidate))),
  createDraft: authorized.input(idInput.extend({ previewToken: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.$transaction(async (tx) => {
      // Serialize importer draft creation across candidates, including concurrent requests.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(738294105)`;
      await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${input.importTourId} FOR UPDATE`;
      const record = await tx.catalogImportTour.findUnique({ where: { id: input.importTourId } });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (!verifyPreviewToken(input.previewToken, ctx.user.id, record.id, record.tourDataJson)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Abre nuevamente la vista previa: los datos cambiaron o la revisión venció." });
      return createDraftInTx(tx, record);
    }, { timeout: 20_000, maxWait: 10_000 });
    await refreshImportCounts(result.importId);
    return { id: result.id, status: result.status };
  }),
});
