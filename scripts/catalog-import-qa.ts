/** Read-only real-PDF QA. Never writes to the database or creates tours. */
import { loadEnvConfig } from "@next/env";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

loadEnvConfig(process.cwd());

async function main() {
  const filename = process.argv[2];
  if (!filename) throw new Error("Indica la ruta del PDF.");
  const pdf = await readFile(filename);
  const { assertPdf } = await import("../src/server/catalog-import/documents");
  assertPdf(pdf);
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await getDocument({ data: new Uint8Array(pdf), isEvalSupported: false, useSystemFonts: true }).promise;
  const sourcePages: Array<{ page: number; text: string }> = [];
  for (let i = 1; i <= document.numPages; i++) {
    const page = await document.getPage(i), content = await page.getTextContent();
    sourcePages.push({ page: i, text: content.items.map((item) => "str" in item ? item.str : "").join(" ") });
  }
  await document.destroy();
  const { GeminiProvider } = await import("../src/server/catalog-import/providers/gemini");
  const { OpenAIProvider } = await import("../src/server/catalog-import/providers/openai");
  const { catalogTourCandidateSchema } = await import("../src/server/catalog-import/schemas");
  const { validateCatalogTour } = await import("../src/server/catalog-import/validator");
  const { findDuplicateMatches } = await import("../src/server/catalog-import/duplicates");
  const { draftCreateData } = await import("../src/server/catalog-import/draft");
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient({ log: [] });
  const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  const snapshot = () => db.tour.findMany({ orderBy: { id: "asc" }, include: { images: true, pricing: { include: { tiers: true } }, itinerary: true, conditions: true, includes: true } });
  try {
    const before = hash(await snapshot());
    const provider = process.env.GEMINI_API_KEY ? new GeminiProvider() : process.env.OPENAI_API_KEY ? new OpenAIProvider() : null;
    if (!provider) throw new Error("No hay API key de Gemini/OpenAI en el entorno local. El PDF se leyó correctamente.");
    const started = Date.now();
    const result = await provider.analyzeCatalog({ filename: path.basename(filename), pdf, signal: AbortSignal.timeout(235_000) });
    const tours = [];
    for (const raw of result.extraction.tours) {
      const parsed = catalogTourCandidateSchema.safeParse(raw);
      if (!parsed.success) { tours.push({ status: "BLOCKED", schemaErrors: parsed.error.issues }); continue; }
      const c = parsed.data;
      const issues = validateCatalogTour(c);
      if (c.sourcePages.some((p) => p > sourcePages.length)) issues.push({ type: "INVALID_VALUE", field: "sourcePages", reason: "Página fuera del PDF", sourcePages: c.sourcePages });
      const duplicates = await findDuplicateMatches(db, c);
      tours.push({ name: c.nameEs, sourcePages: c.sourcePages, status: duplicates.length ? "DUPLICATE_REVIEW" : issues.length ? "DATA_REVIEW" : "READY", issues, duplicates, activities: c.itinerary.reduce((n, day) => n + (day.items?.length ?? 0), 0), prices: c.prices, draftMappingValidated: issues.length === 0 ? draftCreateData(c).status === "DRAFT" : false });
    }
    const after = hash(await snapshot());
    const summary = { source: path.basename(filename), pdfBytes: pdf.length, pages: sourcePages.length,
      provider: provider.name, model: provider.model, latencyMs: Date.now() - started,
      inputTokens: result.inputTokens, outputTokens: result.outputTokens, estimatedCost: result.estimatedCost,
      detectedTours: tours.length, existingToursAndImagesUnchanged: before === after, tours };
    const output = path.resolve(".qa/catalog-import"); await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "lima-extraction.json"), JSON.stringify(result.extraction, null, 2));
    await writeFile(path.join(output, "lima-source-pages.json"), JSON.stringify(sourcePages, null, 2));
    await writeFile(path.join(output, "lima-report.json"), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
  } finally { await db.$disconnect(); }
}

main().catch(() => { console.error("La prueba real no pudo completarse. Comprueba la conexión de BD y las API keys; no se escribieron datos."); process.exitCode = 1; });
