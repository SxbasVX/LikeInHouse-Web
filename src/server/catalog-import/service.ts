import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/lib/db";
import { catalogTourCandidateSchema, type CatalogExtractionEnvelope, type CatalogTourCandidate } from "./schemas";
import { validateCatalogTour } from "./validator";
import { findDuplicateMatches } from "./duplicates";
import type { PriceAdjustment } from "./pricing";
import { getSunatQuote } from "@/server/lib/exchange";

// Published prices: soles at today's SUNAT selling rate, then CATALOG_PRICE_MARKUP_PERCENT (4.5 % by default) on every price.
export async function currentPriceAdjustment(): Promise<PriceAdjustment> {
  const quote = await getSunatQuote();
  const markup = Number(process.env.CATALOG_PRICE_MARKUP_PERCENT ?? "4.5");
  return { penPerUsd: quote.rate, rateDate: quote.date, rateSource: quote.source, markupPercent: Number.isFinite(markup) && markup >= 0 && markup <= 100 ? markup : 4.5 };
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
export async function persistCandidateReview(tx: Prisma.TransactionClient, importTourId: string, candidate: CatalogTourCandidate, userId: string,
  extraIssues: Prisma.ImportIssueCreateManyInput[], { keepChecks = false } = {}) {
  const issues = validateCatalogTour(candidate), duplicates = await findDuplicateMatches(tx, candidate);
  const status = duplicates.length ? "DUPLICATE" as const : issues.length ? "NEEDS_REVIEW" as const : "READY" as const;
  await tx.catalogImportTour.update({ where: { id: importTourId }, data: {
    tourDataJson: jsonData(candidate), sourcePages: candidate.sourcePages, status,
    existingTourId: duplicates[0]?.tourId ?? null, confidence: duplicates[0]?.score ?? null,
    reviewDraftJson: Prisma.DbNull, reviewDraftAt: null,
  } });
  const checked = keepChecks ? await tx.importIssue.findMany({ where: { importTourId, resolved: false, checkedAt: { not: null } }, select: { type: true, field: true, checkedAt: true, checkedById: true } }) : [];
  const checkOf = (issue: { type: string; field?: string | null }) => checked.find((c) => c.type === issue.type && c.field === (issue.field ?? null));
  await tx.importIssue.updateMany({ where: { importTourId, resolved: false }, data: { resolved: true, resolvedAt: new Date(), resolvedById: userId } });
  const fresh: Prisma.ImportIssueCreateManyInput[] = [
    ...issues.map((issue) => ({ ...issue, importTourId })),
    ...duplicates.slice(0, 3).map((d) => ({ importTourId, type: "POSSIBLE_DUPLICATE" as const, field: "tour", valueA: d.tourId, valueB: String(d.score), reason: d.reasons.join(" "), sourcePages: candidate.sourcePages })),
  ];
  await tx.importIssue.createMany({ data: [
    ...fresh.map((issue) => { const mark = checkOf(issue); return mark ? { ...issue, checkedAt: mark.checkedAt, checkedById: mark.checkedById } : issue; }),
    ...extraIssues,
  ] });
  return { status, issues, duplicateMatches: duplicates };
}

// Each candidate is atomic and independent: stored indexes are skipped, so a run cut off by the deadline resumes safely.
// Returns false when the deadline stopped it before every candidate was stored.
export async function persistExtractedCandidates(importId: string, filename: string, extraction: CatalogExtractionEnvelope, model: string, deadline: number): Promise<boolean> {
  const record = { id: importId };
  const adjustment = await currentPriceAdjustment();
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
        const candidate = parsed.data;
        candidate.sourceDocument = filename;
        // Rate and markup always come from the server, never from the model.
        candidate.priceAdjustment = adjustment;
        delete candidate.dismissedDuplicates;
        // A provider cannot impersonate a manual reviewer.
        for (const proof of Object.values(candidate.provenance ?? {})) {
          if (proof.source === "manual") { proof.source = "suggested"; proof.requiresReview = true; }
        }
        const issues = validateCatalogTour(candidate);
        const duplicates = await findDuplicateMatches(tx, candidate);
        await tx.catalogImportTour.create({ data: {
          importId: record.id, sourceIndex,
          status: duplicates.length ? "DUPLICATE" : issues.length ? "NEEDS_REVIEW" : "READY",
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
