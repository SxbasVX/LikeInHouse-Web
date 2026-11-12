import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/lib/db";
import { catalogTourCandidateSchema, type CatalogExtractionEnvelope, type CatalogTourCandidate } from "./schemas";
import { validateCatalogTour } from "./validator";
import { findDuplicateMatches } from "./duplicates";
import { CLAUDE_SUGGESTION_PREFIX, issueKind, pendingCounts, statusFromIssues } from "./severity";
import { normalizeCandidate, RULES_VERSION, type OfficialLists } from "./normalize";
import { getTourDestinations } from "@/server/lib/tour-destinations";
import { getTourCategories } from "@/server/lib/tour-categories";
import type { PriceAdjustment } from "./pricing";
import { getSunatQuote } from "@/server/lib/exchange";

// Published prices: soles at today's SUNAT selling rate, then CATALOG_PRICE_MARKUP_PERCENT (4.5 % by default) on every price.
export async function currentPriceAdjustment(): Promise<PriceAdjustment> {
  const quote = await getSunatQuote();
  const markup = Number(process.env.CATALOG_PRICE_MARKUP_PERCENT ?? "4.5");
  return { penPerUsd: quote.rate, rateDate: quote.date, rateSource: quote.source, markupPercent: Number.isFinite(markup) && markup >= 0 && markup <= 100 ? markup : 4.5 };
}

export async function officialLists(client: Prisma.TransactionClient | typeof db): Promise<OfficialLists> {
  const [destinations, categories] = await Promise.all([getTourDestinations(client), getTourCategories(client)]);
  return { destinations, categories };
}

export const jsonData =(value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

export async function refreshImportCounts(importId: string) {
  const counts = await db.catalogImportTour.groupBy({ by: ["status"], where: { importId }, _count: true });
  const count = (status: string) => counts.find((c) => c.status === status)?._count ?? 0;
  await db.catalogImport.update({ where: { id: importId }, data: {
    readyCount: count("READY"), duplicateCount: count("DUPLICATE"), reviewCount: count("NEEDS_REVIEW"),
    blockedCount: count("BLOCKED") + count("FAILED"), createdCount: count("DRAFT_CREATED"),
  } });
}

// Revalidates an edited candidate, replaces its open issues and clears the review draft.
// Shared by manual review (keepChecks: the reviewer's "seen" marks survive) and Claude suggestions (new content, fresh marks).
export async function persistCandidateReview(tx: Prisma.TransactionClient, importTourId: string, input: CatalogTourCandidate, userId: string,
  extraIssues: Prisma.ImportIssueCreateManyInput[], { keepChecks = false } = {}) {
  const lists = await officialLists(tx);
  // Automatic fixes first, so the reviewer is only asked what a person must decide.
  const candidate = normalizeCandidate(input, lists);
  const issues = validateCatalogTour(candidate, lists), duplicates = await findDuplicateMatches(tx, candidate);
  const checked = keepChecks ? await tx.importIssue.findMany({ where: { importTourId, resolved: false, checkedAt: { not: null } }, select: { type: true, field: true, reason: true, checkedAt: true, checkedById: true } }) : [];
  // Same type, field and wording: a different warning on the same field must be seen again.
  const checkOf = (issue: { type: string; field?: string | null; reason: string }) => checked.find((c) => c.type === issue.type && c.field === (issue.field ?? null) && c.reason === issue.reason);
  const fresh: Prisma.ImportIssueCreateManyInput[] = [
    ...issues.map((issue) => ({ ...issue, importTourId })),
    ...duplicates.slice(0, 3).map((d) => ({ importTourId, type: "POSSIBLE_DUPLICATE" as const, field: "tour", valueA: d.tourId, valueB: String(d.score), reason: d.reasons.join(" "), sourcePages: candidate.sourcePages })),
  ].map((issue) => { const mark = checkOf(issue); return mark ? { ...issue, checkedAt: mark.checkedAt, checkedById: mark.checkedById } : issue; });
  // Accepted warnings (kept marks) don't hold the tour back; anything blocking or not yet seen does.
  // Unresolved extra issues (Claude's suggestions) count too.
  const open = [...fresh, ...extraIssues.filter((i) => !i.resolved)];
  const status = statusFromIssues(open.map((i) => ({ type: i.type, field: i.field ?? null, reason: i.reason, checkedAt: i.checkedAt as Date | null | undefined })), duplicates.length > 0);
  await tx.catalogImportTour.update({ where: { id: importTourId }, data: {
    tourDataJson: jsonData(candidate), sourcePages: candidate.sourcePages, status,
    existingTourId: duplicates[0]?.tourId ?? null, confidence: duplicates[0]?.score ?? null,
    reviewDraftJson: Prisma.DbNull, reviewDraftAt: null,
  } });
  await tx.importIssue.updateMany({ where: { importTourId, resolved: false }, data: { resolved: true, resolvedAt: new Date(), resolvedById: userId } });
  await tx.importIssue.createMany({ data: [...fresh, ...extraIssues] });
  const pending = pendingCounts(open.map((i) => ({ type: i.type, field: i.field ?? null, reason: i.reason, checkedAt: i.checkedAt as Date | null | undefined })));
  return { status, issues, duplicateMatches: duplicates, blocking: pending.blocking, unaccepted: pending.toVerify };
}

const OPEN_STATUSES = ["NEEDS_REVIEW", "READY", "DUPLICATE"];

// Re-applies the automatic rules to a stored candidate (new rules, or a city added to the list).
// Claude's suggestions and the reviewer's ticks are kept. Returns false when the tour is not open for it.
// `onlyIfStale` is for the background pass: overlapping passes must not rewrite (and re-number the issues of) a tour that is already up to date.
export async function revalidateCandidate(importTourId: string, userId: string, adjustment?: PriceAdjustment, onlyIfStale = false): Promise<boolean> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${importTourId} FOR UPDATE`;
    const record = await tx.catalogImportTour.findUnique({ where: { id: importTourId }, include: { import: { select: { status: true } } } });
    // A reviewer's unapproved edits are never rewritten underneath them.
    if (!record || record.createdTourId || record.reviewDraftAt || !OPEN_STATUSES.includes(record.status)) return false;
    // While Claude is still improving the document, rewriting a candidate would discard its pending improvement.
    if (record.import.status === "PROCESSING") return false;
    if (onlyIfStale && !isStaleCandidate(record.tourDataJson)) return false;
    const parsed = catalogTourCandidateSchema.safeParse(record.tourDataJson);
    if (!parsed.success) return false;
    // Candidates imported before prices were converted have no rate yet: without it they could never be created.
    if (parsed.data.prices.length && !parsed.data.priceAdjustment && adjustment) parsed.data.priceAdjustment = adjustment;
    const suggestions = await tx.importIssue.findMany({ where: { importTourId, resolved: false, reason: { startsWith: CLAUDE_SUGGESTION_PREFIX } } });
    await persistCandidateReview(tx, importTourId, parsed.data, userId, suggestions.map((s) => ({
      importTourId, type: s.type, field: s.field, valueA: s.valueA, valueB: s.valueB, reason: s.reason, sourcePages: s.sourcePages, checkedAt: s.checkedAt, checkedById: s.checkedById,
    })), { keepChecks: true });
    return true;
  }, { timeout: 15_000, maxWait: 10_000 });
}

/** Revalidates the given candidates until the deadline; returns how many were left for a later call. */
export async function revalidateCandidates(importTourIds: string[], userId: string, deadline: number, onlyIfStale = false): Promise<number> {
  const imports = new Set<string>();
  const adjustment = importTourIds.length ? await currentPriceAdjustment().catch(() => undefined) : undefined;
  let index = 0;
  for (; index < importTourIds.length && Date.now() < deadline; index++) {
    try {
      if (await revalidateCandidate(importTourIds[index], userId, adjustment, onlyIfStale)) {
        const tour = await db.catalogImportTour.findUnique({ where: { id: importTourIds[index] }, select: { importId: true } });
        if (tour) imports.add(tour.importId);
      }
    } catch { /* one failing candidate never stops the rest; it stays as it was */ }
  }
  for (const importId of imports) await refreshImportCounts(importId);
  return importTourIds.length - index;
}

export const isStaleCandidate = (data: unknown) => (data as { rulesVersion?: unknown } | null)?.rulesVersion !== RULES_VERSION;

// Ticks every open "verify" warning of a tour; with nothing blocking it becomes READY. Caller holds the row lock.
export async function acceptOpenWarnings(tx: Prisma.TransactionClient, importTourId: string, userId: string) {
  const record = await tx.catalogImportTour.findUniqueOrThrow({ where: { id: importTourId }, include: { issues: { where: { resolved: false } } } });
  const toAccept = record.issues.filter((i) => !i.checkedAt && issueKind(i) === "warning").map((i) => i.id);
  const now = new Date();
  if (toAccept.length) await tx.importIssue.updateMany({ where: { id: { in: toAccept } }, data: { checkedAt: now, checkedById: userId } });
  if (!["NEEDS_REVIEW", "READY"].includes(record.status)) return { status: record.status, accepted: toAccept.length, importId: record.importId };
  const status = statusFromIssues(record.issues.map((i) => (toAccept.includes(i.id) ? { ...i, checkedAt: now } : i)), false);
  if (status !== record.status) await tx.catalogImportTour.update({ where: { id: record.id }, data: { status } });
  return { status, accepted: toAccept.length, importId: record.importId };
}

// Each candidate is atomic and independent: stored indexes are skipped, so a run cut off by the deadline resumes safely.
// Returns false when the deadline stopped it before every candidate was stored.
export async function persistExtractedCandidates(importId: string, filename: string, extraction: CatalogExtractionEnvelope, model: string, deadline: number): Promise<boolean> {
  const record = { id: importId };
  const adjustment = await currentPriceAdjustment();
  const lists = await officialLists(db);
  for (const [sourceIndex, raw] of extraction.tours.entries()) {
    if (Date.now() > deadline) return false;
    if (await db.catalogImportTour.findUnique({ where: { importId_sourceIndex: { importId: record.id, sourceIndex } }, select: { id: true } })) continue;
    const parsed = catalogTourCandidateSchema.safeParse(raw);
    try {
      await db.$transaction(async (tx) => {
        if (!parsed.success) {
          await tx.catalogImportTour.create({ data: {
            importId: record.id, sourceIndex, status: "BLOCKED", sourceDocument: filename, sourcePages: [],
            tourDataJson: jsonData(raw ?? {}),
            issues: { create: { type: "INVALID_VALUE", field: "schema", reason: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ").slice(0, 4000), sourcePages: [] } },
          } });
          return;
        }
        const extracted = parsed.data;
        extracted.sourceDocument = filename;
        // Rate, markup and the automatic-fix log always come from the server, never from the model.
        extracted.priceAdjustment = adjustment;
        delete extracted.dismissedDuplicates; delete extracted.autoFixes;
        // A provider cannot impersonate a manual reviewer.
        for (const proof of Object.values(extracted.provenance ?? {})) {
          if (proof.source === "manual") { proof.source = "suggested"; proof.requiresReview = true; }
        }
        const candidate = normalizeCandidate(extracted, lists);
        const issues = validateCatalogTour(candidate, lists);
        const duplicates = await findDuplicateMatches(tx, candidate);
        await tx.catalogImportTour.create({ data: {
          importId: record.id, sourceIndex,
          // Notes never hold a tour back: with nothing to fix or verify it is READY straight away.
          status: statusFromIssues(issues, duplicates.length > 0),
          tourDataJson: jsonData(candidate), sourceDocument: filename, sourcePages: candidate.sourcePages,
          existingTourId: duplicates[0]?.tourId, confidence: duplicates[0]?.score,
          providerUsed: "anthropic", modelUsed: model,
          issues: { create: [
            ...issues,
            ...duplicates.slice(0, 3).map((d) => ({ type: "POSSIBLE_DUPLICATE" as const, field: "tour", valueA: d.tourId, valueB: String(d.score), reason: `${d.reasons.join(" ")} Campos: ${d.matchingFields.join(", ")}`, sourcePages: candidate.sourcePages })),
          ] },
        } });
      }, { timeout: 15_000, maxWait: 10_000 });
    } catch {
      // If candidate persistence fails, preserve a separate blocked result and continue.
      await db.catalogImportTour.upsert({
        where: { importId_sourceIndex: { importId: record.id, sourceIndex } }, update: {},
        create: { importId: record.id, sourceIndex, status: "BLOCKED", sourceDocument: filename,
          sourcePages: parsed.success ? parsed.data.sourcePages : [], tourDataJson: jsonData(raw ?? {}),
          issues: { create: { type: "PROVIDER_ERROR", field: "processing", reason: "No se pudo validar o guardar este candidato. Los demás continúan.", sourcePages: [] } },
        },
      });
    }
  }
  await refreshImportCounts(importId);
  return true;
}

export async function finishImport(importId: string) {
  await refreshImportCounts(importId);
  const blocked = await db.catalogImportTour.count({ where: { importId, status: "BLOCKED" } });
  await db.catalogImport.update({ where: { id: importId }, data: {
    status: blocked ? "PARTIAL" : "COMPLETED", completedAt: new Date(), lastError: null, batchId: null, batchStage: null,
  } });
}
