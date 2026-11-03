import { describe, expect, it } from "vitest";
import { isBlockingIssue, statusFromIssues } from "../severity";
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
});
