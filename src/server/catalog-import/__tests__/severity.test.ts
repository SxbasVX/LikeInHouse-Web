import { describe, expect, it } from "vitest";
import { isBlockingIssue, issueKind, pendingCounts, statusFromIssues } from "../severity";
import { AUTO_NOTE_PREFIX, CONFIRM_REASONS, NOTE_REASONS, VERIFY_PREFIX } from "../validator";
import { validateCatalogTour } from "../validator";
import { draftCreateData } from "../draft";
import { readyCandidate } from "./fixtures";

const issue = (type: string, field: string | null, checkedAt: Date | null = null) => ({ type, field, checkedAt });

describe("blocking issues vs warnings the reviewer can accept", () => {
  it("blocks prices, rate, required data, broken duration and duplicates", () => {
    for (const [type, field] of [["MISSING_REQUIRED", "prices.0.amount"], ["INVALID_VALUE", "prices.0.currency"], ["DATA_REVIEW", "prices.0"],
      ["DATA_REVIEW", "prices"], ["MISSING_REQUIRED", "priceAdjustment"], ["DATA_REVIEW", "priceAdjustment"], ["MISSING_REQUIRED", "nameEs"],
      ["CONTRADICTION", "durationNights"], ["POSSIBLE_DUPLICATE", "tour"], ["DATA_REVIEW", "includesEn"], ["DATA_REVIEW", "prices.1.label"]] as const) {
      expect(isBlockingIssue({ type, field }), `${type} ${field}`).toBe(true);
    }
  });
  it("lets the reviewer accept editorial warnings", () => {
    for (const [type, field] of [["DATA_REVIEW", "imageSuggestions"], ["DATA_REVIEW", "itinerary.0"], ["DATA_REVIEW", "itinerary.0.items.1"],
      ["DATA_REVIEW", "schedule"], ["DATA_REVIEW", "longDescEs"], ["DATA_REVIEW", "category"], ["MISSING_REQUIRED", "metaTitleEn"],
      ["CONTRADICTION", "weight"], ["DATA_REVIEW", "prices.0.source"], ["DATA_REVIEW", "conditions.0"]] as const) {
      expect(isBlockingIssue({ type, field }), `${type} ${field}`).toBe(false);
    }
  });

  it("is READY only when nothing blocks and every warning was accepted", () => {
    const seen = new Date();
    expect(statusFromIssues([], false)).toBe("READY");
    expect(statusFromIssues([issue("DATA_REVIEW", "imageSuggestions")], false)).toBe("NEEDS_REVIEW");
    expect(statusFromIssues([issue("DATA_REVIEW", "imageSuggestions", seen)], false)).toBe("READY");
    expect(statusFromIssues([issue("DATA_REVIEW", "imageSuggestions", seen), issue("MISSING_REQUIRED", "prices.0.amount", seen)], false)).toBe("NEEDS_REVIEW");
    expect(statusFromIssues([], true)).toBe("DUPLICATE");
  });

  it("creates the tour with accepted warnings (and a fallback day title) but never with blocking issues", () => {
    const warned = readyCandidate(); warned.imageSuggestions = []; warned.itinerary[0].titleEs = null;
    expect(validateCatalogTour(warned).length).toBeGreaterThan(0);
    const data = draftCreateData(warned);
    expect(data.itinerary).toMatchObject({ create: [expect.objectContaining({ titleEs: "Día 1" })] });
    const blocked = readyCandidate(); blocked.prices[0].amount = null;
    expect(() => draftCreateData(blocked)).toThrow("revisión");
  });

  it("asks for one tick on doubtful prices and durations, and nothing on editorial notes", () => {
    expect(issueKind({ type: "DATA_REVIEW", field: "prices.0.amount", reason: CONFIRM_REASONS.proposal })).toBe("warning");
    expect(issueKind({ type: "DATA_REVIEW", field: "durationDays", reason: CONFIRM_REASONS.proposal })).toBe("warning");
    expect(issueKind({ type: "CONTRADICTION", field: "prices.0.amount" })).toBe("warning");
    expect(issueKind({ type: "DATA_REVIEW", field: "prices", reason: `${VERIFY_PREFIX}El PDF tiene 60 tarifas.` })).toBe("warning");
    for (const [type, field, reason] of [
      ["DATA_REVIEW", "category", CONFIRM_REASONS.proposal], ["DATA_REVIEW", "difficulty", CONFIRM_REASONS.proposal], ["DATA_REVIEW", "schedule", CONFIRM_REASONS.proposal],
      ["DATA_REVIEW", "prices.0.amount", CONFIRM_REASONS.foreignPages], ["DATA_REVIEW", "durationDays", CONFIRM_REASONS.missingProvenance],
      ["DATA_REVIEW", "longDescEs", "Sugerencia de Claude: tono más comercial."], ["DATA_REVIEW", "destination", `${AUTO_NOTE_PREFIX}Destino ajustado.`],
      ["DATA_REVIEW", "imageSuggestions", NOTE_REASONS.noImages], ["DATA_REVIEW", "itinerary.0", NOTE_REASONS.missingDayTitle],
      ["CONTRADICTION", "conditions.cancellation", "La tabla indica 40% y la mitad."], ["MISSING_REQUIRED", "metaTitleEn", "Dato obligatorio ausente."],
    ] as const) expect(issueKind({ type, field, reason }), `${field} · ${reason}`).toBe("info");
  });

  it("is READY with notes alone, and with warnings once they are ticked", () => {
    const note = { type: "DATA_REVIEW", field: "longDescEs", reason: "Sugerencia de Claude: tono más comercial.", checkedAt: null };
    const doubt = { type: "CONTRADICTION", field: "prices.0.amount", checkedAt: null as Date | null };
    expect(statusFromIssues([note, note], false)).toBe("READY");
    expect(statusFromIssues([note, doubt], false)).toBe("NEEDS_REVIEW");
    expect(statusFromIssues([note, { ...doubt, checkedAt: new Date() }], false)).toBe("READY");
    expect(pendingCounts([note, doubt, { type: "INVALID_VALUE", field: "destination" }])).toEqual({ blocking: 1, toVerify: 1, notes: 1 });
  });
});
