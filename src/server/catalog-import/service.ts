import "server-only";
import { db } from "@/server/lib/db";
import { catalogExtractionSchema } from "./schemas";
import { validateCatalogTour } from "./validator";
import { findDuplicateMatches } from "./duplicates";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { getProviderSelection } from "./providers/router";
import type { AIProvider } from "./providers/types";

export async function processCatalogPdf(filename: string, pdf: Buffer, userId: string) {
  const importRecord = await db.catalogImport.create({
    data: { filename, status: "PROCESSING", createdById: userId },
  });
  const startedAt = Date.now();
  let selectedProvider: AIProvider | undefined;

  try {
    const selection = getProviderSelection();
    const providers: AIProvider[] = [selection.primary, selection.fallback]
      .filter((name, index, values) => values.indexOf(name) === index)
      .map((name) => name === "openai" ? new OpenAIProvider() : new GeminiProvider());
    let extraction;
    let lastError: unknown;
    for (const candidateProvider of providers) {
      const providerStartedAt = Date.now();
      try {
        extraction = catalogExtractionSchema.parse(
          await candidateProvider.analyzeCatalog({ filename, pdf })
        );
        selectedProvider = candidateProvider;
        await db.aIProviderOperation.create({
          data: {
            importId: importRecord.id,
            provider: candidateProvider.name,
            model: candidateProvider.model,
            operation: "catalog_extraction",
            success: true,
            fallbackUsed: candidateProvider.name !== selection.primary,
            latencyMs: Date.now() - providerStartedAt,
          },
        });
        break;
      } catch (error) {
        lastError = error;
        await db.aIProviderOperation.create({
          data: {
            importId: importRecord.id,
            provider: candidateProvider.name,
            model: candidateProvider.model,
            operation: "catalog_extraction",
            success: false,
            fallbackUsed: candidateProvider.name !== selection.primary,
            latencyMs: Date.now() - providerStartedAt,
            error: error instanceof Error ? error.message : "Error del proveedor",
          },
        });
      }
    }
    if (!selectedProvider || !extraction) {
      throw lastError instanceof Error ? lastError : new Error("Ningún proveedor IA pudo procesar el catálogo.");
    }
    const provider = selectedProvider;

    await db.$transaction(async (tx) => {
      for (const candidate of extraction.tours) {
        const issues = validateCatalogTour(candidate);
        const duplicates = await findDuplicateMatches(tx, candidate);
        const status = duplicates.length > 0
          ? "DUPLICATE"
          : issues.length > 0
            ? "NEEDS_REVIEW"
            : "READY";

        const created = await tx.catalogImportTour.create({
          data: {
            importId: importRecord.id,
            status,
            tourDataJson: candidate,
            sourceDocument: candidate.sourceDocument,
            sourcePages: candidate.sourcePages,
            existingTourId: duplicates[0]?.tourId,
            providerUsed: provider.name,
            modelUsed: provider.model,
            confidence: duplicates.length > 0 ? duplicates[0].score : issues.length > 0 ? 0.5 : 0.9,
          },
        });

        await tx.importIssue.createMany({
          data: [
            ...issues.map((issue) => ({
              importTourId: created.id,
              type: issue.type,
              field: issue.field,
              reason: issue.reason,
              sourcePages: issue.sourcePages,
            })),
            ...duplicates.slice(0, 3).map((match) => ({
              importTourId: created.id,
              type: "POSSIBLE_DUPLICATE" as const,
              field: "tour",
              valueA: match.tourId,
              reason: match.reasons.join(" "),
              sourcePages: candidate.sourcePages,
            })),
          ],
        });
      }

      const counts = await tx.catalogImportTour.groupBy({
        by: ["status"],
        where: { importId: importRecord.id },
        _count: true,
      });
      const count = (status: string) => counts.find((item) => item.status === status)?._count ?? 0;
      await tx.catalogImport.update({
        where: { id: importRecord.id },
        data: {
          status: "COMPLETED",
          totalTours: extraction.tours.length,
          readyCount: count("READY"),
          duplicateCount: count("DUPLICATE"),
          reviewCount: count("NEEDS_REVIEW"),
          blockedCount: count("BLOCKED"),
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido durante la extracción.";
    await db.$transaction([
      db.catalogImport.update({
        where: { id: importRecord.id },
        data: { status: "FAILED" },
      }),
      db.aIProviderOperation.create({
        data: {
          importId: importRecord.id,
          provider: selectedProvider?.name ?? "unknown",
          model: selectedProvider?.model ?? "unknown",
          operation: "catalog_extraction",
          success: false,
          latencyMs: Date.now() - startedAt,
          error: message,
        },
      }),
    ]);
    throw error;
  }

  return db.catalogImport.findUniqueOrThrow({
    where: { id: importRecord.id },
    include: { tours: { include: { issues: true } } },
  });
}
