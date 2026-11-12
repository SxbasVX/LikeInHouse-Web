import "server-only";
import { createHash } from "node:crypto";
import type { CatalogImport, CatalogImportTour } from "@prisma/client";
import { db } from "@/server/lib/db";
import { downloadCatalogPdf } from "./documents";
import { catalogExtractionEnvelopeSchema } from "./schemas";
import { claudeBatchResults, CLAUDE_MODEL, extractionCall, isClaudeBatchDone, isPermanentBatchError, parseExtraction, submitClaudeBatch, type BatchOutcome } from "./providers/anthropic";
import { ProviderError } from "./providers/result";
import { finishImport, jsonData, officialLists, persistExtractedCandidates } from "./service";
import { applyEnrichment, assertEnrichable, enrichmentCall, logOperation, parseCandidateRecord } from "./assistant";

// Pipeline: upload -> extraction batch -> candidates -> enrichment batch -> human review.
// Batches have no request time limit; the history poll advances them in short, resumable steps.
const BATCH_CHECK_INTERVAL_MS = 30_000;
// Leaves room under the tRPC route's 60 s limit for the history query itself and one in-flight transaction.
const ADVANCE_BUDGET_MS = 30_000;
// A batch is never submitted this close to the deadline: a cut-off before its id is saved would orphan it.
const SUBMIT_MARGIN_MS = 10_000;
const MAX_BATCH_FAILURES = 5;
// Batches end within 24 h; past this the job can only be stuck.
const MAX_JOB_AGE_MS = 26 * 60 * 60_000;
// Placeholder batchId: the extraction is already saved, there is no Claude batch to wait for.
const RESUME_SAVED_EXTRACTION = "resume";

export async function claimCatalogJob(importId: string): Promise<boolean> {
  const claim = await db.catalogImport.updateMany({ where: { id: importId, status: { in: ["UPLOADED", "FAILED", "PARTIAL"] }, attempts: { lt: 3 } },
    data: { status: "PROCESSING", startedAt: new Date(), completedAt: null, lastError: null, attempts: { increment: 1 }, batchId: null, batchStage: null, batchCheckedAt: null, batchFailures: 0 },
  });
  return claim.count === 1;
}

async function failJob(importId: string, message: string) {
  const total = await db.catalogImportTour.count({ where: { importId } });
  await db.catalogImport.update({ where: { id: importId }, data: {
    status: total ? "PARTIAL" : "FAILED", completedAt: new Date(), lastError: message.slice(0, 1000), batchId: null, batchStage: null,
  } });
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Error desconocido al procesar el documento.";

export async function runCatalogJob(importId: string, suppliedPdf?: Buffer): Promise<void> {
  const record = await db.catalogImport.findUniqueOrThrow({ where: { id: importId } });
  try {
    if (process.env.ENABLE_CATALOG_IMPORT !== "true") throw new Error("Importador deshabilitado.");
    const user = await db.user.findUnique({ where: { id: record.createdById }, select: { role: true, isActive: true } });
    if (!user?.isActive || user.role !== "DEVELOPER") throw new Error("El usuario ya no tiene permiso.");
    // Resuming a saved extraction needs no AI call or PDF: the next poll stores what is missing.
    if (record.extractionJson) {
      await db.catalogImport.update({ where: { id: importId }, data: { batchStage: "extraction", batchId: RESUME_SAVED_EXTRACTION, batchCheckedAt: null } });
      return;
    }
    const pdf = suppliedPdf ?? (record.sourceUrl ? await downloadCatalogPdf(record.sourceUrl) : null);
    if (!pdf) throw new Error("Debes volver a adjuntar el PDF original.");
    const batchId = await submitClaudeBatch([{ customId: "extraction", call: extractionCall(record.filename, pdf, undefined, await officialLists(db)) }]);
    await db.catalogImport.update({ where: { id: importId }, data: { batchId, batchStage: "extraction", batchCheckedAt: new Date() } });
  } catch (error) {
    await failJob(importId, errorMessage(error));
  }
}

// Called after the history query responds. A lease on batchCheckedAt keeps concurrent polls from processing the same job.
export async function advanceCatalogBatches(): Promise<void> {
  const deadline = Date.now() + ADVANCE_BUDGET_MS;
  const due = await db.catalogImport.findMany({
    where: { status: "PROCESSING", batchId: { not: null }, OR: [{ batchCheckedAt: null }, { batchCheckedAt: { lt: new Date(Date.now() - BATCH_CHECK_INTERVAL_MS) } }] },
    orderBy: { batchCheckedAt: { sort: "asc", nulls: "first" } }, take: 3,
  });
  for (const job of due) {
    if (Date.now() > deadline) break;
    const lease = await db.catalogImport.updateMany({ where: { id: job.id, batchId: job.batchId, batchCheckedAt: job.batchCheckedAt }, data: { batchCheckedAt: new Date(deadline) } });
    if (!lease.count) continue;
    try {
      // Results stay available for weeks: a finished batch is collected however late the inbox is opened.
      // Only a batch that is still running after a day is given up on.
      if (job.batchId !== RESUME_SAVED_EXTRACTION && !await isClaudeBatchDone(job.batchId!)) {
        if (job.startedAt && Date.now() - job.startedAt.getTime() > MAX_JOB_AGE_MS) {
          // With the tours already extracted, only the text improvements are lost: the document is still usable.
          if (job.batchStage === "enrichment") {
            await finishImport(job.id);
            await db.catalogImport.update({ where: { id: job.id }, data: { lastError: "Los tours están listos, pero Claude no entregó las mejoras de texto a tiempo. Puedes pedirlas con el botón de Claude en cada tour." } });
          } else await failJob(job.id, "Claude no entregó resultados en 24 horas. Vuelve a subir el PDF.");
        }
        continue;
      }
      const finished = job.batchStage === "enrichment" ? await advanceEnrichment(job, deadline) : await advanceExtraction(job, deadline);
      if (!finished) await db.catalogImport.update({ where: { id: job.id }, data: { batchCheckedAt: null } });
    } catch (error) {
      // Network or database trouble is retried on later polls; a missing batch or repeated failure ends the job.
      const failures = job.batchFailures + 1;
      if (isPermanentBatchError(error) || failures >= MAX_BATCH_FAILURES) {
        await failJob(job.id, `No se pudo completar con Claude: ${errorMessage(error)}`).catch(() => undefined);
      } else {
        await db.catalogImport.update({ where: { id: job.id }, data: { batchFailures: failures, lastError: `Reintentando (${failures}/${MAX_BATCH_FAILURES}): ${errorMessage(error)}`.slice(0, 1000) } }).catch(() => undefined);
      }
    }
  }
}

async function advanceExtraction(job: CatalogImport, deadline: number): Promise<boolean> {
  let model = CLAUDE_MODEL;
  if (!job.extractionJson) {
    let outcome: BatchOutcome | undefined;
    for await (const item of claudeBatchResults(job.batchId!)) outcome = item;
    if (!outcome) { await failJob(job.id, "Claude no devolvió resultado para el documento."); return true; }
    let tours, message = outcome.error;
    if (!message && outcome.reply) {
      try { tours = parseExtraction(outcome.reply.text); } catch (error) { message = error instanceof ProviderError ? error.message : "anthropic: respuesta inválida."; }
    }
    if (!tours || !outcome.reply) {
      await logOperation(job.id, null, "catalog_extraction", { reply: outcome.reply, error: message ?? "anthropic: respuesta vacía.", batchId: job.batchId! });
      await failJob(job.id, message ?? "anthropic: respuesta vacía."); return true;
    }
    model = outcome.reply.model;
    await logOperation(job.id, null, "catalog_extraction", { reply: outcome.reply, batchId: job.batchId! });
    if (!tours.tours.length) { await failJob(job.id, "No se detectaron tours; revisar el documento antes de volver a analizar."); return true; }
    job = await db.catalogImport.update({ where: { id: job.id }, data: { extractionJson: jsonData(tours), totalTours: tours.tours.length } });
  }
  return continueAfterExtraction(job, model, deadline);
}

// Stores the extracted candidates, then sends the ones never enriched to Claude for automatic enrichment.
async function continueAfterExtraction(job: CatalogImport, model: string, deadline: number): Promise<boolean> {
  const extraction = catalogExtractionEnvelopeSchema.parse(job.extractionJson);
  if (!await persistExtractedCandidates(job.id, job.filename, extraction, model, deadline - SUBMIT_MARGIN_MS)) return false;
  if (Date.now() > deadline - SUBMIT_MARGIN_MS) return false;
  // A resumed import must not re-enrich (and pay again for) candidates Claude already handled.
  const enriched = await db.aIProviderOperation.findMany({ where: { importId: job.id, operation: "candidate_enrichment" }, select: { importTourId: true } });
  const handled = new Set(enriched.map((op) => op.importTourId));
  const tours = await db.catalogImportTour.findMany({ where: { importId: job.id, status: { in: ["READY", "NEEDS_REVIEW"] }, createdTourId: null } });
  const lists = await officialLists(db);
  const requests = tours.filter((tour) => !handled.has(tour.id)).flatMap((tour) => {
    try { assertEnrichable(tour); return [{ customId: enrichmentId(tour), call: { ...enrichmentCall(parseCandidateRecord(tour), undefined, lists), cacheSystem: true } }]; } catch { return []; }
  });
  if (!requests.length) { await finishImport(job.id); return true; }
  let batchId: string;
  try {
    batchId = await submitClaudeBatch(requests);
  } catch (error) {
    await finishImport(job.id);
    await db.catalogImport.update({ where: { id: job.id }, data: { lastError: `Tours listos, pero la mejora automática no se pudo enviar (${errorMessage(error)}). Usa el botón de Claude en cada tour.` } });
    return true;
  }
  await db.catalogImport.update({ where: { id: job.id }, data: { batchId, batchStage: "enrichment", batchCheckedAt: new Date(), batchFailures: 0 } });
  return true;
}

async function advanceEnrichment(job: CatalogImport, deadline: number): Promise<boolean> {
  const batchId = job.batchId!;
  const done = new Set((await db.aIProviderOperation.findMany({ where: { batchId }, select: { importTourId: true } })).map((op) => op.importTourId));
  for await (const outcome of claudeBatchResults(batchId)) {
    if (Date.now() > deadline) return false;
    const [tourId, hash] = outcome.customId.split("_");
    if (done.has(tourId)) continue;
    const tour = await db.catalogImportTour.findUnique({ where: { id: tourId } });
    // A reviewer edited, skipped or drafted it meanwhile: their work wins, and the suggestion is dropped.
    if (!tour || enrichmentHash(tour) !== hash) continue;
    let error = outcome.error;
    if (!error && outcome.reply) {
      // One candidate's failure is recorded and never blocks the rest of the batch.
      try { await applyEnrichment(tour, outcome.reply.text, job.createdById); } catch (e) { error = errorMessage(e); }
    }
    await logOperation(job.id, tour.id, "candidate_enrichment", { reply: outcome.reply, error, batchId });
  }
  await finishImport(job.id);
  return true;
}

// Batch custom_ids allow 64 characters of [A-Za-z0-9_-]: the candidate id plus a hash of the state Claude saw.
// A review draft started meanwhile changes the hash, so the reviewer's in-progress work is never overwritten.
const enrichmentHash = (tour: CatalogImportTour) => createHash("sha256").update(JSON.stringify([tour.status, tour.createdTourId, tour.reviewDraftAt, tour.tourDataJson])).digest("hex").slice(0, 32);
const enrichmentId = (tour: CatalogImportTour) => `${tour.id}_${enrichmentHash(tour)}`;
