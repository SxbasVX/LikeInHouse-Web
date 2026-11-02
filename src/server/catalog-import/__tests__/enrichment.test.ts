import { afterEach, describe, expect, it, vi } from "vitest";
import { readyCandidate } from "./fixtures";
import { DOCUMENT_ONLY_FIELDS, mergeEnrichment } from "../enrichment";
import { validateCatalogTour } from "../validator";
import { estimateCost, parseJsonReply } from "../providers/result";

afterEach(() => { vi.unstubAllEnvs(); });

describe("Claude enrichment merge", () => {
  it("restores every document-only fact Claude tried to change", () => {
    const original = readyCandidate();
    const proposed = { ...readyCandidate(), destination: "Lima", durationDays: 3, durationNights: 2, sourcePages: [9],
      prices: [{ ...original.prices[0], amount: 80 }], schedule: { frequency: "daily", days: [], times: ["09:00"], dates: [], notesEs: null, notesEn: null } };
    const result = mergeEnrichment(original, proposed, []);
    if ("error" in result) throw new Error(result.error);
    for (const field of DOCUMENT_ONLY_FIELDS) expect(result.candidate[field]).toEqual(original[field]);
    expect(result.changes).toEqual([]);
  });

  it("marks improved text as a suggestion that blocks the draft until confirmed", () => {
    const original = readyCandidate();
    const result = mergeEnrichment(original, { ...readyCandidate(), longDescEs: "Texto mejorado.", attractions: ["Cusco", "Sacsayhuamán"] },
      [{ field: "attractions", evidence: "https://www.peru.travel/es/destinos/cusco" }]);
    if ("error" in result) throw new Error(result.error);
    expect(result.changes.map((c) => c.field).sort()).toEqual(["attractions", "longDescEs"]);
    expect(result.candidate.provenance?.attractions).toMatchObject({ source: "suggested", requiresReview: true, evidence: "https://www.peru.travel/es/destinos/cusco" });
    expect(result.candidate.provenance?.longDescEs?.evidence).toContain("sin evidencia");
    expect(result.candidate.provenance?.category).toEqual(original.provenance?.category);
    expect(validateCatalogTour(result.candidate).map((i) => i.field)).toEqual(expect.arrayContaining(["attractions", "longDescEs"]));
  });

  it("keeps the original provenance of untouched fields even if Claude rewrites it", () => {
    const original = readyCandidate();
    const proposed = { ...readyCandidate(), provenance: { category: { source: "manual", requiresReview: false, sourcePages: [2], evidence: "falso" } } };
    const result = mergeEnrichment(original, proposed, []);
    if ("error" in result) throw new Error(result.error);
    expect(result.candidate.provenance).toEqual(original.provenance);
  });

  it("keeps optional fields Claude left out instead of deleting them", () => {
    const original = readyCandidate();
    const { attractions: _a, imageSuggestions: _i, conditions: _c, ...proposed } = { ...readyCandidate(), longDescEs: "Texto mejorado." };
    const result = mergeEnrichment(original, proposed, []);
    if ("error" in result) throw new Error(result.error);
    expect(result.candidate.attractions).toEqual(original.attractions);
    expect(result.candidate.imageSuggestions).toEqual(original.imageSuggestions);
    expect(result.candidate.conditions).toEqual(original.conditions);
    expect(result.changes.map((c) => c.field)).toEqual(["longDescEs"]);
  });

  it("keeps itinerary times and rejects a reshaped itinerary", () => {
    const original = readyCandidate();
    const retimed = readyCandidate();
    retimed.itinerary[0].items![0] = { ...retimed.itinerary[0].items![0], time: "06:00", titleEs: "Recojo en hotel" };
    const result = mergeEnrichment(original, retimed, []);
    if ("error" in result) throw new Error(result.error);
    expect(result.candidate.itinerary[0].items![0]).toMatchObject({ time: "08:00", titleEs: "Recojo en hotel" });
    const reshaped = readyCandidate(); reshaped.itinerary[0].items!.pop();
    const rejected = mergeEnrichment(original, reshaped, []);
    if ("error" in rejected) throw new Error(rejected.error);
    expect(rejected.candidate.itinerary).toEqual(original.itinerary);
  });

  it("never overwrites a field the reviewer confirmed manually", () => {
    const original = readyCandidate();
    original.provenance!.nameEs = { source: "manual", requiresReview: false, sourcePages: [2], evidence: "Confirmado con la página 2." };
    const result = mergeEnrichment(original, { ...readyCandidate(), nameEs: "Otro nombre", longDescEs: "Texto mejorado." }, []);
    if ("error" in result) throw new Error(result.error);
    expect(result.candidate.nameEs).toBe(original.nameEs);
    expect(result.candidate.provenance?.nameEs?.source).toBe("manual");
    expect(result.changes.map((c) => c.field)).toEqual(["longDescEs"]);
  });

  it("rejects proposals that break the candidate schema", () => {
    expect(mergeEnrichment(readyCandidate(), { nameEs: "Solo nombre" }, [])).toHaveProperty("error");
  });
});

describe("Claude reply parsing and cost", () => {
  it("reads JSON wrapped in a fence or preceded by search narration", () => {
    expect(parseJsonReply("anthropic", "```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
    expect(parseJsonReply("anthropic", "Voy a verificar los atractivos.\n{\"a\":{\"b\":2}}")).toEqual({ a: { b: 2 } });
    expect(() => parseJsonReply("anthropic", "sin json")).toThrow("JSON");
  });
  it("adds web searches to token cost and stays empty without configured rates", () => {
    vi.stubEnv("ANTHROPIC_INPUT_COST_PER_MILLION", "");
    expect(estimateCost(1_000_000, 100_000, 0)).toBeNull();
    vi.stubEnv("ANTHROPIC_INPUT_COST_PER_MILLION", "4");
    vi.stubEnv("ANTHROPIC_OUTPUT_COST_PER_MILLION", "20");
    expect(estimateCost(1_000_000, 100_000, 5)).toBeCloseTo(4 + 2 + 0.05);
  });
});
