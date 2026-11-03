import "server-only";
import { revalidateTag } from "next/cache";
import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/server/lib/db";
import { createAuditLog } from "@/server/lib/audit";
import { CACHE_TAGS } from "@/server/lib/cache";
import { claudeBatchResults, isClaudeBatchDone, isPermanentBatchError, submitClaudeBatch } from "@/server/catalog-import/providers/anthropic";
import { parseJsonReply } from "@/server/catalog-import/providers/result";
import { buildProposedContent, changedGroups, keepsTimes, sameGroup, tourContentSchema, tourProposalSchema, withGroup, type ReviewGroup, type TourContent } from "./content";
import { catalogReviewSystemPrompt, catalogReviewUserContent, REFERENCE_TOUR_SLUG, type TourFacts } from "./prompt";

type Db = PrismaClient | Prisma.TransactionClient;

export class ReviewError extends Error {}

const tourSelect = {
  id: true, slug: true, nameEs: true, nameEn: true, shortDescEs: true, shortDescEn: true, longDescEs: true, longDescEn: true,
  metaTitleEs: true, metaTitleEn: true, metaDescEs: true, metaDescEn: true,
  destination: true, durationDays: true, durationNights: true, durationHours: true, category: true, difficulty: true, tourType: true,
  itinerary: { orderBy: { dayNumber: "asc" as const }, select: { id: true, dayNumber: true, titleEs: true, titleEn: true, descriptionEs: true, descriptionEn: true } },
  includes: { orderBy: [{ type: "asc" as const }, { sortOrder: "asc" as const }], select: { id: true, type: true, textEs: true, textEn: true } },
  conditions: { where: { isActive: true }, orderBy: { sortOrder: "asc" as const }, select: { id: true, type: true, textEs: true, textEn: true } },
  pricing: { select: { tiers: { orderBy: { sortOrder: "asc" as const }, select: { labelEs: true, priceUsd: true } } } },
} satisfies Prisma.TourSelect;
type LoadedTour = Prisma.TourGetPayload<{ select: typeof tourSelect }>;

const contentOf = (t: LoadedTour): TourContent => ({
  nameEs: t.nameEs, nameEn: t.nameEn, shortDescEs: t.shortDescEs, shortDescEn: t.shortDescEn, longDescEs: t.longDescEs, longDescEn: t.longDescEn,
  metaTitleEs: t.metaTitleEs, metaTitleEn: t.metaTitleEn, metaDescEs: t.metaDescEs, metaDescEn: t.metaDescEn,
  itinerary: t.itinerary, includes: t.includes, conditions: t.conditions.map((c) => ({ ...c, type: String(c.type) })),
});
const factsOf = (t: LoadedTour): TourFacts => ({
  destination: t.destination, durationDays: t.durationDays, durationNights: t.durationNights, durationHours: t.durationHours,
  category: t.category, difficulty: t.difficulty, tourType: t.tourType,
  prices: (t.pricing?.tiers ?? []).map((tier) => `${tier.labelEs}: US$ ${Number(tier.priceUsd).toFixed(2)}`),
});

export async function loadTourContent(tx: Db, tourId: string): Promise<TourContent | null> {
  const tour = await tx.tour.findUnique({ where: { id: tourId }, select: tourSelect });
  return tour ? contentOf(tour) : null;
}

// ─── Start ───

export async function startCatalogReview(userId: string): Promise<{ runId: string; tours: number }> {
  if (await db.catalogReviewRun.count({ where: { status: "PROCESSING" } })) throw new ReviewError("Ya hay una revisión del catálogo en curso.");
  const tours = await db.tour.findMany({ where: { isActive: true }, select: tourSelect, orderBy: { nameEs: "asc" } });
  if (!tours.length) throw new ReviewError("No hay tours activos para revisar.");
  const reference = tours.find((t) => t.slug === REFERENCE_TOUR_SLUG) ?? null;
  const system = catalogReviewSystemPrompt(reference ? { content: contentOf(reference), facts: factsOf(reference) } : null);

  // A new run replaces earlier proposals that were never applied, so only one current proposal exists per tour.
  await db.tourRevision.updateMany({ where: { status: "PROPOSED" }, data: { status: "DISMISSED" } });
  const run = await db.catalogReviewRun.create({ data: { createdById: userId, referenceTourId: reference?.id } });
  const revisions: Array<{ id: string; tour: LoadedTour }> = [];
  for (const tour of tours) {
    const revision = await db.tourRevision.create({ data: { runId: run.id, tourId: tour.id, beforeJson: contentOf(tour) as unknown as Prisma.InputJsonValue }, select: { id: true } });
    revisions.push({ id: revision.id, tour });
  }
  try {
    const batchId = await submitClaudeBatch(revisions.map(({ id, tour }) => ({
      customId: id,
      call: { system, cacheSystem: true, effort: "medium", maxTokens: 32_000, content: [{ type: "text", text: catalogReviewUserContent(contentOf(tour), factsOf(tour)) }] },
    })));
    await db.catalogReviewRun.update({ where: { id: run.id }, data: { batchId, batchCheckedAt: new Date() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar a Claude.";
    await db.catalogReviewRun.update({ where: { id: run.id }, data: { status: "FAILED", lastError: message, completedAt: new Date() } });
    await db.tourRevision.updateMany({ where: { runId: run.id }, data: { status: "FAILED", error: message } });
    throw new ReviewError(message);
  }
  createAuditLog({ userId, action: "CREATE", entity: "CatalogReviewRun", entityId: run.id, changes: { tours: tours.length } });
  return { runId: run.id, tours: tours.length };
}

// ─── Collect results (called after the overview query responds) ───

const CHECK_INTERVAL_MS = 30_000, BUDGET_MS = 30_000, MAX_FAILURES = 5, MAX_AGE_MS = 26 * 60 * 60_000;

export async function advanceCatalogReviews(): Promise<void> {
  const deadline = Date.now() + BUDGET_MS;
  const due = await db.catalogReviewRun.findMany({
    where: { status: "PROCESSING", batchId: { not: null }, OR: [{ batchCheckedAt: null }, { batchCheckedAt: { lt: new Date(Date.now() - CHECK_INTERVAL_MS) } }] },
    take: 2,
  });
  for (const run of due) {
    const lease = await db.catalogReviewRun.updateMany({ where: { id: run.id, batchCheckedAt: run.batchCheckedAt }, data: { batchCheckedAt: new Date(deadline) } });
    if (!lease.count) continue;
    try {
      if (Date.now() - run.createdAt.getTime() > MAX_AGE_MS) { await finishRun(run.id, "Claude no entregó resultados en 24 horas."); continue; }
      if (!await isClaudeBatchDone(run.batchId!)) continue;
      const pending = new Set((await db.tourRevision.findMany({ where: { runId: run.id, status: "PENDING" }, select: { id: true } })).map((r) => r.id));
      let finished = true;
      for await (const outcome of claudeBatchResults(run.batchId!)) {
        if (Date.now() > deadline) { finished = false; break; }
        if (!pending.has(outcome.customId)) continue;
        await storeOutcome(outcome.customId, outcome);
      }
      if (finished) await finishRun(run.id);
      else await db.catalogReviewRun.update({ where: { id: run.id }, data: { batchCheckedAt: null } });
    } catch (error) {
      const failures = run.batchFailures + 1, message = error instanceof Error ? error.message : "Error desconocido.";
      if (isPermanentBatchError(error) || failures >= MAX_FAILURES) await finishRun(run.id, `No se pudo completar con Claude: ${message}`).catch(() => undefined);
      else await db.catalogReviewRun.update({ where: { id: run.id }, data: { batchFailures: failures, lastError: `Reintentando (${failures}/${MAX_FAILURES}): ${message}` } }).catch(() => undefined);
    }
  }
}

async function storeOutcome(revisionId: string, outcome: { reply?: { text: string; inputTokens: number; outputTokens: number; estimatedCost: number | null }; error?: string }) {
  const usage = { inputTokens: outcome.reply?.inputTokens, outputTokens: outcome.reply?.outputTokens, estimatedCost: outcome.reply?.estimatedCost };
  const fail = (error: string) => db.tourRevision.updateMany({ where: { id: revisionId, status: "PENDING" }, data: { status: "FAILED", error: error.slice(0, 1000), ...usage } });
  if (outcome.error || !outcome.reply) return fail(outcome.error ?? "Claude no devolvió respuesta.");
  let raw: unknown;
  try { raw = parseJsonReply("anthropic", outcome.reply.text); } catch { return fail("Claude devolvió una propuesta que no es JSON."); }
  const proposal = tourProposalSchema.safeParse(raw);
  if (!proposal.success) return fail(`Propuesta con formato inválido: ${proposal.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  const revision = await db.tourRevision.findUniqueOrThrow({ where: { id: revisionId }, select: { beforeJson: true, tour: { select: { durationDays: true } } } });
  const before = tourContentSchema.parse(revision.beforeJson);
  const { after, rejected, linked } = buildProposedContent(before, proposal.data, Math.max(1, revision.tour.durationDays));
  const groups = changedGroups(before, after);
  await db.tourRevision.updateMany({ where: { id: revisionId, status: "PENDING" }, data: {
    status: groups.length ? "PROPOSED" : "NO_CHANGES",
    proposalJson: { after, rejected, linked, notes: proposal.data.notes, groups } as unknown as Prisma.InputJsonValue, ...usage,
  } });
}

async function finishRun(runId: string, error?: string) {
  await db.tourRevision.updateMany({ where: { runId, status: "PENDING" }, data: { status: "FAILED", error: error ?? "Claude no devolvió resultado para este tour." } });
  await db.catalogReviewRun.update({ where: { id: runId }, data: { status: error ? "FAILED" : "COMPLETED", completedAt: new Date(), lastError: error ?? null } });
}

// ─── Apply / undo ───

export const proposalOf = (json: unknown) => {
  const proposal = json as { after: TourContent; rejected: Partial<Record<ReviewGroup, string>>; linked?: ReviewGroup[]; notes: Array<{ field: string; reason: string }>; groups: ReviewGroup[] };
  return { ...proposal, linked: proposal.linked ?? [] };
};

async function writeGroups(tx: Prisma.TransactionClient, tourId: string, content: TourContent, groups: ReviewGroup[]) {
  const scalar: Prisma.TourUpdateInput = {};
  if (groups.includes("name")) Object.assign(scalar, { nameEs: content.nameEs, nameEn: content.nameEn });
  if (groups.includes("shortDesc")) Object.assign(scalar, { shortDescEs: content.shortDescEs, shortDescEn: content.shortDescEn });
  if (groups.includes("longDesc")) Object.assign(scalar, { longDescEs: content.longDescEs, longDescEn: content.longDescEn });
  if (groups.includes("seo")) Object.assign(scalar, { metaTitleEs: content.metaTitleEs, metaTitleEn: content.metaTitleEn, metaDescEs: content.metaDescEs, metaDescEn: content.metaDescEn });
  if (Object.keys(scalar).length) await tx.tour.update({ where: { id: tourId }, data: scalar });
  if (groups.includes("itinerary")) {
    // By day number: a review may create days (an itinerary that lived in the description) and undo removes them again.
    await tx.itineraryDay.deleteMany({ where: { tourId, dayNumber: { notIn: content.itinerary.map((d) => d.dayNumber) } } });
    for (const d of content.itinerary) {
      const data = { titleEs: d.titleEs, titleEn: d.titleEn, descriptionEs: d.descriptionEs, descriptionEn: d.descriptionEn };
      await tx.itineraryDay.upsert({ where: { tourId_dayNumber: { tourId, dayNumber: d.dayNumber } }, create: { tourId, dayNumber: d.dayNumber, ...data }, update: data });
    }
  }
  if (groups.includes("includes")) for (const i of content.includes) await tx.tourInclude.update({ where: { id: i.id }, data: { textEs: i.textEs, textEn: i.textEn } });
  if (groups.includes("conditions")) for (const c of content.conditions) await tx.tourCondition.update({ where: { id: c.id }, data: { type: c.type as never, textEs: c.textEs, textEn: c.textEn } });
}

/** Applies the chosen groups, only where the tour still has exactly the content Claude saw. */
export async function applyRevision(revisionId: string, groups: ReviewGroup[], userId: string) {
  const result = await db.$transaction(async (tx) => {
    const revision = await tx.tourRevision.findUnique({ where: { id: revisionId } });
    if (!revision || revision.status !== "PROPOSED") throw new ReviewError("Esta propuesta ya no está pendiente.");
    await tx.$queryRaw`SELECT "id" FROM "Tour" WHERE "id" = ${revision.tourId} FOR UPDATE`;
    const current = await loadTourContent(tx, revision.tourId);
    if (!current) throw new ReviewError("El tour ya no existe.");
    const before = tourContentSchema.parse(revision.beforeJson), { after, groups: proposed, linked } = proposalOf(revision.proposalJson);
    const chosen = groups.filter((g) => proposed.includes(g));
    if (!chosen.length) throw new ReviewError("Elige al menos un bloque para aplicar.");
    if (linked.some((g) => chosen.includes(g)) && !linked.every((g) => chosen.includes(g))) {
      throw new ReviewError("La descripción y el itinerario se aplican juntos: el itinerario sale de la descripción.");
    }
    // Last guard, also for proposals made before descriptions could hand their schedule to the itinerary.
    if (!keepsTimes(before, after, chosen)) throw new ReviewError("Con esos bloques se perderían horarios del tour. Aplica la descripción junto con el itinerario.");
    const edited = chosen.filter((g) => !sameGroup(current, before, g));
    if (edited.length) throw new ReviewError(`El tour se editó después de la revisión (${edited.join(", ")}). Vuelve a revisar el catálogo para este tour.`);
    await writeGroups(tx, revision.tourId, after, chosen);
    await tx.tourRevision.update({ where: { id: revisionId }, data: { status: "APPLIED", appliedFields: chosen, appliedAt: new Date(), appliedById: userId } });
    return { tourId: revision.tourId, applied: chosen };
  }, { timeout: 20_000, maxWait: 10_000 });
  revalidateTag(CACHE_TAGS.tours);
  createAuditLog({ userId, action: "UPDATE", entity: "Tour", entityId: result.tourId, changes: { catalogReview: revisionId, applied: result.applied } });
  return result;
}

/** Restores the applied groups, unless someone changed them again afterwards. */
export async function undoRevision(revisionId: string, userId: string) {
  const result = await db.$transaction(async (tx) => {
    const revision = await tx.tourRevision.findUnique({ where: { id: revisionId } });
    if (!revision || revision.status !== "APPLIED") throw new ReviewError("Esta propuesta no está aplicada.");
    await tx.$queryRaw`SELECT "id" FROM "Tour" WHERE "id" = ${revision.tourId} FOR UPDATE`;
    const current = await loadTourContent(tx, revision.tourId);
    if (!current) throw new ReviewError("El tour ya no existe.");
    const before = tourContentSchema.parse(revision.beforeJson), { after } = proposalOf(revision.proposalJson);
    const groups = revision.appliedFields as ReviewGroup[];
    const edited = groups.filter((g) => !sameGroup(current, after, g));
    if (edited.length) throw new ReviewError(`El tour se volvió a editar después de aplicar (${edited.join(", ")}); deshazlo a mano desde Tours.`);
    let restored = current;
    for (const g of groups) restored = withGroup(restored, before, g);
    await writeGroups(tx, revision.tourId, restored, groups);
    await tx.tourRevision.update({ where: { id: revisionId }, data: { status: "PROPOSED", appliedFields: [], appliedAt: null, appliedById: null } });
    return { tourId: revision.tourId, restored: groups };
  }, { timeout: 20_000, maxWait: 10_000 });
  revalidateTag(CACHE_TAGS.tours);
  createAuditLog({ userId, action: "UPDATE", entity: "Tour", entityId: result.tourId, changes: { catalogReviewUndo: revisionId, restored: result.restored } });
  return result;
}
