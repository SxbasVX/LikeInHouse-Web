import { describe, expect, it } from "vitest";
import { lowestTierPrice } from "@/lib/pricing";
import { tourCreateSchema } from "@/lib/validators/tour";
import { draftCreateData } from "../draft";
import { readyCandidate } from "./fixtures";

const baseTour = {
  nameEs: "Paquete Tarapoto", nameEn: "Tarapoto package", slug: "paquete-tarapoto", category: "Naturaleza", destination: "Tarapoto",
  durationDays: 3, durationNights: 2, shortDescEs: "Paquete con varias categorías.", shortDescEn: "Package with several hotel options.",
  longDescEs: "Descripción completa del paquete.", longDescEn: "Full description of the package.",
};
const tier = (priceUsd: number) => ({ labelEs: "Adulto", labelEn: "Adult", priceUsd, isDefault: false });

describe("informational tours with 'Adquiérelo desde'", () => {
  it("shows the lowest real rate, ignoring empty or zero ones", () => {
    expect(lowestTierPrice({ tiers: [{ priceUsd: "320.50" }, { priceUsd: 189.9 }, { priceUsd: 0 }] })).toBe(189.9);
    expect(lowestTierPrice({ tiers: [] })).toBeNull();
    expect(lowestTierPrice(null)).toBeNull();
  });

  it("creates many-rate imports as informational, keeping their rates", () => {
    const c = readyCandidate(); c.informational = true;
    const data = draftCreateData(c);
    expect(data.tourType).toBe("INFORMATIONAL");
    expect(data.pricing).toMatchObject({ create: { tiers: { create: [expect.objectContaining({ priceUsd: 104.5 })] } } });
    expect(draftCreateData(readyCandidate()).tourType).toBe("BOOKABLE");
  });

  it("lets informational tours save rates or none, but bookable tours still need one", () => {
    expect(tourCreateSchema.safeParse({ ...baseTour, tourType: "INFORMATIONAL", pricing: { tiers: [tier(150)] } }).success).toBe(true);
    expect(tourCreateSchema.safeParse({ ...baseTour, tourType: "INFORMATIONAL" }).success).toBe(true);
    expect(tourCreateSchema.safeParse({ ...baseTour, tourType: "INFORMATIONAL", pricing: { tiers: [] } }).success).toBe(true);
    expect(tourCreateSchema.safeParse({ ...baseTour, tourType: "BOOKABLE", pricing: { tiers: [] } }).success).toBe(false);
    expect(tourCreateSchema.safeParse({ ...baseTour, tourType: "BOOKABLE" }).success).toBe(false);
  });
});
