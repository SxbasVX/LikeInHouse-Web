import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/lib/db";
import { catalogExtractionEnvelopeSchema, catalogTourCandidateSchema } from "./schemas";
import { validateCatalogTour } from "./validator";
import { findDuplicateMatches } from "./duplicates";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { getProviderSelection } from "./providers/router";
import { ProviderError } from "./providers/http";
import type { AIProvider, AIProviderName, CatalogAnalysisInput, ProviderResult } from "./providers/types";

export function createProvider(name: AIProviderName): AIProvider {
  return name === "gemini" ? new GeminiProvider() : name === "openai" ? new OpenAIProvider() : new AnthropicProvider();
}
export function isProviderConfigured(name: AIProviderName): boolean {
  return Boolean(process.env[name === "gemini" ? "GEMINI_API_KEY" : name === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"]);
}
export const jsonData = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

export async function refreshImportCounts(importId: string) {
  const counts = await db.catalogImportTour.groupBy({ by: ["status"], where: { importId }, _count: true });
  const count = (status: string) => counts.find((c) => c.status === status)?._count ?? 0;
  await db.catalogImport.update({ where: { id: importId }, data: {
    readyCount: count("READY"), duplicateCount: count("DUPLICATE"), reviewCount: count("NEEDS_REVIEW"),
    blockedCount: count("BLOCKED") + count("FAILED"), createdCount: count("DRAFT_CREATED"),
  } });
}

async function analyze(importId: string, input: CatalogAnalysisInput): Promise<{ result: ProviderResult; provider: AIProvider }> {
  const selection = getProviderSelection();
  let lastError: ProviderError | undefined;
  for (const name of [...new Set([selection.primary, selection.fallback])].filter(isProviderConfigured)) {
    const provider = createProvider(name), started = Date.now();
    try {
      const result = await provider.analyzeCatalog(input);
      await db.aIProviderOperation.create({ data: {
        importId, provider: name, model: provider.model, operation: "catalog_extraction", success: true,
        fallbackUsed: name !== selection.primary, latencyMs: Date.now() - started,
        inputTokens: result.inputTokens, outputTokens: result.outputTokens, estimatedCost: result.estimatedCost,
      } });
      return { result, provider };
    } catch (error) {
      lastError = error instanceof ProviderError ? error : new ProviderError(name, null, true);
      await db.aIProviderOperation.create({ data: {
        importId, provider: name, model: provider.model, operation: "catalog_extraction", success: false,
        fallbackUsed: name !== selection.primary, latencyMs: Date.now() - started, error: lastError.message,
      } });
      // Content errors go to human review; fallback is for technical failure only.
      if (!lastError.technical) throw lastError;
    }
  }
  throw lastError ?? new Error("No hay un proveedor IA habilitado con API key.");
}

// Each candidate is atomic and independent. The extraction snapshot allows safe resume.
export async function processCatalogPdf(filename: string, pdf: Buffer, userId: string, importId?: string) {
  const record = importId
    ? await db.catalogImport.findUniqueOrThrow({ where: { id: importId } })
    : await db.catalogImport.create({ data: { filename, createdById: userId, status: "PROCESSING", startedAt: new Date(), attempts: 1 } });
  const signal = AbortSignal.timeout(235_000);
  try {
    let extraction = record.extractionJson ? catalogExtractionEnvelopeSchema.parse(record.extractionJson) : undefined;
    let provider: AIProvider | undefined;
    if (!extraction) {
      const analysis = await analyze(record.id, { filename, pdf, signal });
      extraction = analysis.result.extraction; provider = analysis.provider;
      if (!extraction.tours.length) throw new Error("No se detectaron tours; revisar el documento antes de volver a analizar.");
      await db.catalogImport.update({ where: { id: record.id }, data: { extractionJson: jsonData(extraction), totalTours: extraction.tours.length } });
    }
    for (const [sourceIndex, raw] of extraction.tours.entries()) {
      signal.throwIfAborted();
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
            providerUsed: provider?.name, modelUsed: provider?.model,
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
    await refreshImportCounts(record.id);
    const blocked = await db.catalogImportTour.count({ where: { importId: record.id, status: "BLOCKED" } });
    await db.catalogImport.update({ where: { id: record.id }, data: { status: blocked ? "PARTIAL" : "COMPLETED", completedAt: new Date(), lastError: null } });
  } catch (error) {
    const total = await db.catalogImportTour.count({ where: { importId: record.id } });
    await refreshImportCounts(record.id);
    await db.catalogImport.update({ where: { id: record.id }, data: {
      status: total ? "PARTIAL" : "FAILED", completedAt: new Date(),
      lastError: error instanceof ProviderError ? error.message : "El procesamiento no pudo completarse. Se conservaron los resultados obtenidos; puedes reanudarlo.",
    } });
  }
  return record.id;
}
