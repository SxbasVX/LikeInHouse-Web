import "server-only";
import { db } from "@/server/lib/db";
import { downloadCatalogPdf } from "./documents";
import { processCatalogPdf } from "./service";

export async function claimCatalogJob(importId: string): Promise<boolean> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(738294106)`;
    const active = await tx.catalogImport.count({ where: { status: "PROCESSING", startedAt: { gt: new Date(Date.now() - 6 * 60_000) } } });
    if (active >= 2) return false;
    const claim = await tx.catalogImport.updateMany({ where: { id: importId, status: { in: ["UPLOADED", "FAILED", "PARTIAL"] }, attempts: { lt: 3 } },
      data: { status: "PROCESSING", startedAt: new Date(), completedAt: null, lastError: null, attempts: { increment: 1 } },
    });
    return claim.count === 1;
  });
}

export async function runCatalogJob(importId: string, suppliedPdf?: Buffer): Promise<void> {
  const record = await db.catalogImport.findUniqueOrThrow({ where: { id: importId } });
  try {
    if (process.env.ENABLE_CATALOG_IMPORT !== "true") throw new Error("Importador deshabilitado.");
    const user = await db.user.findUnique({ where: { id: record.createdById }, select: { role: true, isActive: true } });
    if (!user?.isActive || user.role !== "DEVELOPER") throw new Error("El usuario ya no tiene permiso.");
    // Resuming a saved extraction does not require another AI call or PDF download.
    const pdf = record.extractionJson ? Buffer.alloc(0) : suppliedPdf ?? (record.sourceUrl ? await downloadCatalogPdf(record.sourceUrl) : null);
    if (!pdf) throw new Error("Debes volver a adjuntar el PDF original.");
    await processCatalogPdf(record.filename, pdf, record.createdById, record.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al procesar el documento.";
    await db.catalogImport.update({
      where: { id: importId },
      data: { status: "FAILED", completedAt: new Date(), lastError: message.slice(0, 1000) },
    });
  }
}
