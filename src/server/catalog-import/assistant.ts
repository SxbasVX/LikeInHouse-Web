import "server-only";
import type { CatalogImportTour } from "@prisma/client";
import { db } from "@/server/lib/db";
import { catalogTourCandidateSchema, type CatalogTourCandidate } from "./schemas";
import { assistantSystemPrompt, enrichmentReplySchema, enrichmentSystemPrompt, mergeEnrichment } from "./enrichment";
import { callClaude, CLAUDE_MODEL, type ClaudeCall, type ClaudeReply } from "./providers/anthropic";
import { parseJsonReply, ProviderError } from "./providers/result";
import { officialLists, persistCandidateReview, refreshImportCounts } from "./service";
import type { OfficialLists } from "./normalize";

export class AssistError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

// Leaves headroom under the route's 300 s limit for the database work that follows.
const ASSIST_TIMEOUT_MS = 270_000;

export function parseCandidateRecord(record: CatalogImportTour): CatalogTourCandidate {
  const parsed = catalogTourCandidateSchema.safeParse(record.tourDataJson);
  if (!parsed.success) throw new AssistError(409, "Corrige la estructura del candidato antes de usar Claude.");
  return parsed.data;
}

async function loadCandidate(importTourId: string) {
  const record = await db.catalogImportTour.findUnique({ where: { id: importTourId } });
  if (!record) throw new AssistError(404, "Candidato no encontrado.");
  return { record, candidate: parseCandidateRecord(record) };
}

// A reply with an error is a call that was billed but whose result could not be used.
export async function logOperation(importId: string, importTourId: string | null, operation: string, outcome: { reply?: ClaudeReply; error?: string; latencyMs?: number; batchId?: string }) {
  await db.aIProviderOperation.create({ data: {
    importId, importTourId, batchId: outcome.batchId, provider: "anthropic", model: outcome.reply?.model ?? CLAUDE_MODEL, operation, success: !outcome.error,
    latencyMs: outcome.latencyMs, error: outcome.error?.slice(0, 1000),
    inputTokens: outcome.reply?.inputTokens, outputTokens: outcome.reply?.outputTokens, estimatedCost: outcome.reply?.estimatedCost,
  } });
}

// Every call is logged, successful or not, so cost and failures stay visible in the import history.
async function logged(importId: string, importTourId: string, operation: string, call: ClaudeCall): Promise<ClaudeReply> {
  const started = Date.now();
  let reply: ClaudeReply;
  try {
    reply = await callClaude(call);
  } catch (error) {
    const message = error instanceof ProviderError ? error.message : "Error desconocido al consultar a Claude.";
    // A failed log write must not hide why Claude failed.
    await logOperation(importId, importTourId, operation, { error: message, latencyMs: Date.now() - started }).catch(() => undefined);
    throw new AssistError(502, message);
  }
  await logOperation(importId, importTourId, operation, { reply, latencyMs: Date.now() - started });
  return reply;
}

const candidateContent = (candidate: CatalogTourCandidate, request: string) => [
  { type: "text" as const, text: `<candidato>\n${JSON.stringify(candidate)}\n</candidato>` },
  { type: "text" as const, text: request },
];

export function enrichmentCall(candidate: CatalogTourCandidate, instructions?: string, lists?: OfficialLists): ClaudeCall {
  return {
    // Ten server-tool iterations fit in one turn, so a batch request never needs a pause_turn resume.
    // The reply is a patch (changed keys only), so it needs far less output than a whole candidate.
    system: enrichmentSystemPrompt(lists), effort: "medium", maxTokens: 32_000, web: { searches: 5, fetches: 3 },
    content: candidateContent(candidate, instructions?.trim() || "Mejora los textos y completa los datos no críticos que falten."),
  };
}

export function assertEnrichable(record: CatalogImportTour): void {
  if (record.createdTourId || record.status === "DRAFT_CREATED") throw new AssistError(409, "El borrador ya fue creado; edítalo desde el formulario habitual.");
  if (record.status === "BLOCKED") throw new AssistError(409, "Este candidato fue omitido o está bloqueado; revísalo manualmente.");
  // Claude rewrites tourDataJson; with unapproved edits pending, the reviewer's draft would silently go stale.
  if (record.reviewDraftAt) throw new AssistError(409, "Tienes cambios sin aprobar en este tour. Apruébalos o descártalos antes de pedir mejoras a Claude.");
}

// Saves Claude's proposal unless the candidate changed since `snapshot` was read (a reviewer's work wins).
export async function applyEnrichment(snapshot: CatalogImportTour, replyText: string, userId: string) {
  const candidate = parseCandidateRecord(snapshot);
  let raw: unknown = null;
  try { raw = parseJsonReply("anthropic", replyText); } catch { /* reported as an invalid format below */ }
  const envelope = enrichmentReplySchema.safeParse(raw);
  if (!envelope.success) throw new AssistError(502, "Claude devolvió una propuesta con formato inválido. Vuelve a intentarlo.");
  const merged = mergeEnrichment(candidate, envelope.data.candidate, envelope.data.changes);
  if ("error" in merged) throw new AssistError(502, `La propuesta de Claude no cumple el esquema: ${merged.error}`);
  if (!merged.changes.length) return { status: snapshot.status, changes: [] };

  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "CatalogImportTour" WHERE "id" = ${snapshot.id} FOR UPDATE`;
    const current = await tx.catalogImportTour.findUniqueOrThrow({ where: { id: snapshot.id } });
    if (current.createdTourId || current.reviewDraftAt || current.status !== snapshot.status || JSON.stringify(current.tourDataJson) !== JSON.stringify(snapshot.tourDataJson)) {
      throw new AssistError(409, "El candidato cambió mientras Claude trabajaba. Vuelve a abrir la vista previa e inténtalo de nuevo.");
    }
    return persistCandidateReview(tx, snapshot.id, merged.candidate, userId, merged.changes.map((change) => ({
      importTourId: snapshot.id, type: "DATA_REVIEW" as const, field: change.field, valueA: change.before, valueB: change.after,
      reason: `Sugerencia de Claude: ${change.evidence}`, sourcePages: candidate.sourcePages,
    })));
  }, { timeout: 15_000, maxWait: 10_000 });
  await refreshImportCounts(snapshot.importId);
  return { status: result.status, changes: merged.changes };
}

export async function enrichCandidate(importTourId: string, userId: string, instructions?: string) {
  const { record, candidate } = await loadCandidate(importTourId);
  assertEnrichable(record);
  const reply = await logged(record.importId, record.id, "candidate_enrichment", { ...enrichmentCall(candidate, instructions, await officialLists(db)), signal: AbortSignal.timeout(ASSIST_TIMEOUT_MS) });
  return { ...await applyEnrichment(record, reply.text, userId), sources: reply.sources };
}

export async function askAboutCandidate(importTourId: string, question: string) {
  const { record, candidate } = await loadCandidate(importTourId);
  const reply = await logged(record.importId, record.id, "candidate_question", {
    system: assistantSystemPrompt(), effort: "low", maxTokens: 16_000, web: { searches: 3, fetches: 2 },
    signal: AbortSignal.timeout(ASSIST_TIMEOUT_MS), content: candidateContent(candidate, question),
  });
  return { answer: reply.text, sources: reply.sources };
}
