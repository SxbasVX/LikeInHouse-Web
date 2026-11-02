import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readyCandidate } from "./fixtures";

vi.mock("server-only", () => ({}));
const db = vi.hoisted(() => ({
  catalogImport: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn() },
  catalogImportTour: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
  user: { findUnique: vi.fn() },
  aIProviderOperation: { findMany: vi.fn() },
}));
vi.mock("@/server/lib/db", () => ({ db }));
const claude = vi.hoisted(() => ({ isClaudeBatchDone: vi.fn(), claudeBatchResults: vi.fn(), submitClaudeBatch: vi.fn(), isPermanentBatchError: vi.fn(() => false) }));
vi.mock("../providers/anthropic", () => ({
  CLAUDE_MODEL: "claude-opus-5-5", ...claude,
  extractionCall: vi.fn(() => ({ kind: "extraction" })),
  parseExtraction: (text: string) => JSON.parse(text),
}));
const service = vi.hoisted(() => ({ finishImport: vi.fn(), persistExtractedCandidates: vi.fn() }));
vi.mock("../service", () => ({ ...service, jsonData: (v: unknown) => v }));
const assistant = vi.hoisted(() => ({ applyEnrichment: vi.fn(), logOperation: vi.fn() }));
vi.mock("../assistant", () => ({
  ...assistant, AssistError: class extends Error {}, assertEnrichable: vi.fn(),
  enrichmentCall: vi.fn(() => ({ kind: "enrichment" })), parseCandidateRecord: (r: { tourDataJson: unknown }) => r.tourDataJson,
}));

const { advanceCatalogBatches, runCatalogJob } = await import("../jobs");

const reply = (text: string) => ({ text, sources: [], model: "claude-opus-5-5", inputTokens: 10, outputTokens: 5, estimatedCost: 0.001 });
const hash = (tour: { status: string; tourDataJson: unknown }) => createHash("sha256").update(JSON.stringify([tour.status, null, null, tour.tourDataJson])).digest("hex").slice(0, 32);
async function* results(...items: unknown[]) { yield* items; }
const job = (overrides: object) => ({ id: "imp1", filename: "catalogo.pdf", createdById: "dev", status: "PROCESSING", batchId: "batch_1", batchStage: "extraction", batchCheckedAt: null, batchFailures: 0, startedAt: new Date(), extractionJson: null, ...overrides });

beforeEach(() => {
  vi.clearAllMocks();
  db.catalogImport.updateMany.mockResolvedValue({ count: 1 });
  db.catalogImport.update.mockImplementation(async ({ data }) => job({ ...data }));
  service.persistExtractedCandidates.mockResolvedValue(true);
  claude.isClaudeBatchDone.mockResolvedValue(true);
  claude.isPermanentBatchError.mockReturnValue(false);
  db.aIProviderOperation.findMany.mockResolvedValue([]);
});

describe("Claude batch pipeline", () => {
  it("submits the PDF as an extraction batch instead of analyzing inside the request", async () => {
    vi.stubEnv("ENABLE_CATALOG_IMPORT", "true");
    db.catalogImport.findUniqueOrThrow.mockResolvedValue(job({ status: "PROCESSING", batchId: null, batchStage: null }));
    db.user.findUnique.mockResolvedValue({ role: "DEVELOPER", isActive: true });
    claude.submitClaudeBatch.mockResolvedValue("batch_new");
    await runCatalogJob("imp1", Buffer.from("%PDF-1.7"));
    expect(claude.submitClaudeBatch).toHaveBeenCalledWith([{ customId: "extraction", call: { kind: "extraction" } }]);
    expect(db.catalogImport.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ batchId: "batch_new", batchStage: "extraction" }) }));
    vi.unstubAllEnvs();
  });

  it("waits while the batch is still running", async () => {
    db.catalogImport.findMany.mockResolvedValue([job({})]);
    claude.isClaudeBatchDone.mockResolvedValue(false);
    await advanceCatalogBatches();
    expect(claude.claudeBatchResults).not.toHaveBeenCalled();
  });

  it("skips a job another poll already leased", async () => {
    db.catalogImport.findMany.mockResolvedValue([job({})]);
    db.catalogImport.updateMany.mockResolvedValue({ count: 0 });
    await advanceCatalogBatches();
    expect(claude.isClaudeBatchDone).not.toHaveBeenCalled();
  });

  it("stores the extraction, then sends reviewable candidates to an enrichment batch", async () => {
    db.catalogImport.findMany.mockResolvedValue([job({})]);
    claude.claudeBatchResults.mockReturnValue(results({ customId: "extraction", reply: reply(JSON.stringify({ sourceDocument: "catalogo.pdf", tours: [readyCandidate()] })) }));
    const tour = { id: "tour1", status: "READY", createdTourId: null, tourDataJson: readyCandidate() };
    db.catalogImportTour.findMany.mockResolvedValue([tour]);
    claude.submitClaudeBatch.mockResolvedValue("batch_2");
    await advanceCatalogBatches();
    expect(service.persistExtractedCandidates).toHaveBeenCalledWith("imp1", "catalogo.pdf", expect.objectContaining({ tours: [expect.any(Object)] }), "claude-opus-5-5", expect.any(Number));
    expect(claude.submitClaudeBatch).toHaveBeenCalledWith([{ customId: `tour1_${hash(tour)}`, call: { kind: "enrichment" } }]);
    expect(db.catalogImport.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ batchId: "batch_2", batchStage: "enrichment" }) }));
  });

  it("fails the job with Claude's reason when extraction errored", async () => {
    db.catalogImport.findMany.mockResolvedValue([job({})]);
    claude.claudeBatchResults.mockReturnValue(results({ customId: "extraction", error: "anthropic: solicitud vencida en el lote." }));
    db.catalogImportTour.count.mockResolvedValue(0);
    await advanceCatalogBatches();
    expect(db.catalogImport.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED", lastError: "anthropic: solicitud vencida en el lote." }) }));
    expect(claude.submitClaudeBatch).not.toHaveBeenCalled();
  });

  it("applies enrichment only to candidates unchanged since submission, then finishes", async () => {
    const submitted = { status: "READY", tourDataJson: readyCandidate() };
    const untouched = { id: "tourA", createdTourId: null, ...submitted };
    const edited = { id: "tourB", createdTourId: null, status: "READY", tourDataJson: { ...readyCandidate(), nameEs: "Editado por el revisor" } };
    const skipped = { id: "tourC", createdTourId: null, status: "BLOCKED", tourDataJson: readyCandidate() };
    // A review draft opened after submission: same official data, but the reviewer is mid-edit.
    const drafting = { id: "tourE", createdTourId: null, reviewDraftAt: new Date(), ...submitted };
    db.catalogImport.findMany.mockResolvedValue([job({ batchStage: "enrichment", extractionJson: {} })]);
    db.catalogImportTour.findUnique.mockImplementation(async ({ where }) => ({ tourA: untouched, tourB: edited, tourC: skipped, tourE: drafting })[where.id as "tourA"]);
    claude.claudeBatchResults.mockReturnValue(results(
      { customId: `tourE_${hash(submitted)}`, reply: reply("{}") },
      { customId: `tourA_${hash(submitted)}`, reply: reply("{}") },
      { customId: `tourB_${hash(submitted)}`, reply: reply("{}") },
      { customId: `tourC_${hash(submitted)}`, reply: reply("{}") },
    ));
    await advanceCatalogBatches();
    expect(assistant.applyEnrichment).toHaveBeenCalledTimes(1);
    expect(assistant.applyEnrichment).toHaveBeenCalledWith(untouched, "{}", "dev");
    expect(service.finishImport).toHaveBeenCalledWith("imp1");
  });

  it("keeps going when one candidate fails and never re-collects results already logged", async () => {
    const a = { id: "tourA", createdTourId: null, status: "READY", tourDataJson: readyCandidate() };
    const b = { id: "tourB", createdTourId: null, status: "NEEDS_REVIEW", tourDataJson: readyCandidate() };
    const c = { id: "tourD", createdTourId: null, status: "READY", tourDataJson: readyCandidate() };
    db.catalogImport.findMany.mockResolvedValue([job({ batchStage: "enrichment", extractionJson: {} })]);
    db.aIProviderOperation.findMany.mockResolvedValue([{ importTourId: "tourD" }]);
    db.catalogImportTour.findUnique.mockImplementation(async ({ where }) => ({ tourA: a, tourB: b, tourD: c })[where.id as "tourA"]);
    assistant.applyEnrichment.mockRejectedValueOnce(new Error("timeout de transacción"));
    claude.claudeBatchResults.mockReturnValue(results(
      { customId: `tourA_${hash(a)}`, reply: reply("{}") }, { customId: `tourB_${hash(b)}`, reply: reply("{}") }, { customId: `tourD_${hash(c)}`, reply: reply("{}") },
    ));
    await advanceCatalogBatches();
    expect(assistant.applyEnrichment).toHaveBeenCalledTimes(2);
    expect(assistant.logOperation).toHaveBeenCalledWith("imp1", "tourA", "candidate_enrichment", expect.objectContaining({ error: "timeout de transacción", batchId: "batch_1" }));
    expect(assistant.logOperation).not.toHaveBeenCalledWith("imp1", "tourD", expect.anything(), expect.anything());
    expect(service.finishImport).toHaveBeenCalledWith("imp1");
  });

  it("ends a job whose batch no longer exists instead of retrying forever", async () => {
    db.catalogImport.findMany.mockResolvedValue([job({})]);
    claude.isClaudeBatchDone.mockRejectedValue(new Error("404 not_found"));
    claude.isPermanentBatchError.mockReturnValue(true);
    db.catalogImportTour.count.mockResolvedValue(0);
    await advanceCatalogBatches();
    expect(db.catalogImport.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
  });

  it("counts transient failures and gives up after five", async () => {
    claude.isClaudeBatchDone.mockRejectedValue(new Error("ECONNRESET"));
    db.catalogImport.findMany.mockResolvedValue([job({ batchFailures: 1 })]);
    await advanceCatalogBatches();
    expect(db.catalogImport.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ batchFailures: 2 }) }));
    db.catalogImport.findMany.mockResolvedValue([job({ batchFailures: 4 })]);
    db.catalogImportTour.count.mockResolvedValue(3);
    await advanceCatalogBatches();
    expect(db.catalogImport.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PARTIAL" }) }));
  });

  it("releases the lease to resume soon when candidate storage ran out of time", async () => {
    db.catalogImport.findMany.mockResolvedValue([job({ batchId: "resume", extractionJson: { sourceDocument: "catalogo.pdf", tours: [] } })]);
    service.persistExtractedCandidates.mockResolvedValue(false);
    await advanceCatalogBatches();
    expect(claude.isClaudeBatchDone).not.toHaveBeenCalled();
    expect(db.catalogImport.update).toHaveBeenLastCalledWith({ where: { id: "imp1" }, data: { batchCheckedAt: null } });
  });
});
