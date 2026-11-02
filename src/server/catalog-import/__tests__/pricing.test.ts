import { describe, expect, it } from "vitest";
import { publishedPrice, type PriceAdjustment } from "../pricing";
import { draftCreateData } from "../draft";
import { validateCatalogTour } from "../validator";
import { readyCandidate } from "./fixtures";

const adjustment: PriceAdjustment = { penPerUsd: 3.75, rateDate: "2026-11-02", rateSource: "SUNAT", markupPercent: 4.5 };

describe("published USD prices", () => {
  it("converts soles at the SUNAT rate and then adds the markup", () => {
    expect(publishedPrice({ amount: 450, currency: "PEN" }, adjustment)).toEqual({ usdAtRate: 120, final: 125.4 });
  });
  it("adds the markup to prices already in dollars", () => {
    expect(publishedPrice({ amount: 100, currency: "USD" }, adjustment)).toEqual({ usdAtRate: 100, final: 104.5 });
  });
  it("rounds each step to cents", () => {
    expect(publishedPrice({ amount: 199, currency: "PEN" }, adjustment)).toEqual({ usdAtRate: 53.07, final: 55.46 });
  });
  it("cannot price unsupported currencies, missing amounts or a missing rate", () => {
    expect(publishedPrice({ amount: 100, currency: "EUR" }, adjustment)).toBeNull();
    expect(publishedPrice({ amount: null, currency: "PEN" }, adjustment)).toBeNull();
    expect(publishedPrice({ amount: 100, currency: "USD" }, undefined)).toBeNull();
  });

  it("creates the tour with the published USD price, not the PDF amount", () => {
    const c = readyCandidate(); c.prices[0] = { ...c.prices[0], amount: 450, currency: "PEN" };
    expect(validateCatalogTour(c)).toHaveLength(0);
    const tier = (draftCreateData(c).pricing as { create: { tiers: { create: Array<{ priceUsd: number }> } } }).create.tiers.create[0];
    expect(tier.priceUsd).toBe(125.4);
  });
  it("blocks the draft until there is a real SUNAT rate", () => {
    const missing = readyCandidate(); delete missing.priceAdjustment;
    expect(validateCatalogTour(missing).some((i) => i.field === "priceAdjustment" && i.type === "MISSING_REQUIRED")).toBe(true);
    const emergency = readyCandidate(); emergency.priceAdjustment = { ...adjustment, rateSource: "fallback" };
    expect(validateCatalogTour(emergency).some((i) => i.field === "priceAdjustment")).toBe(true);
  });
});
