import { describe, expect, it, vi } from "vitest";
import { findDuplicateMatches, DUPLICATE_THRESHOLD } from "../duplicates";
import { renderItineraryDay } from "../editorial";
import type { CatalogTourCandidate } from "../schemas";
import { readyCandidate } from "./fixtures";

function titicacaCandidate(): CatalogTourCandidate {
  const c = readyCandidate();
  Object.assign(c, { slug: "uros-amantani-2d-1n", nameEs: "Uros y Amantaní 2D/1N", nameEn: "Uros and Amantani 2D/1N", destination: "Puno", attractions: ["Uros", "Amantaní"] });
  c.itinerary[0].items = [
    { time: "07:45", titleEs: "Navegación a los Uros", titleEn: "Boat to Uros", descriptionEs: "Navegamos hacia las islas flotantes de los Uros y su construcción de totora.", descriptionEn: "We sail to the floating islands." },
    { time: "14:00", titleEs: "Turismo vivencial en Amantaní", titleEn: "Homestay in Amantani", descriptionEs: "Familias locales de Amantaní nos reciben con almuerzo típico y caminata al mirador.", descriptionEn: "Local families welcome us." },
  ];
  return c;
}

const existingTour = (overrides: Record<string, unknown>, from: CatalogTourCandidate) => ({
  id: "tour-existing", slug: "otro-slug", nameEs: "Experiencia vivencial en el Titicaca", nameEn: "Titicaca living experience",
  destination: "Puno", durationDays: from.durationDays, durationNights: from.durationNights, durationHours: from.durationHours,
  itinerary: [{ descriptionEs: renderItineraryDay(from.itinerary[0], "Es"), descriptionEn: "" }],
  pricing: { tiers: [] }, conditions: [], ...overrides,
});

const fakeDb = (tours: unknown[]) => ({ tour: { findMany: vi.fn().mockResolvedValue(tours) } }) as unknown as Parameters<typeof findDuplicateMatches>[0];

describe("duplicate detection", () => {
  it("catches the same route sold under a different name", async () => {
    const c = titicacaCandidate();
    const [match] = await findDuplicateMatches(fakeDb([existingTour({}, c)]), c);
    expect(match.matchingFields).toEqual(expect.arrayContaining(["destination", "duration", "attractions", "itinerary"]));
    expect(match.matchingFields).not.toContain("name");
    expect(match.score).toBeGreaterThanOrEqual(DUPLICATE_THRESHOLD);
  });

  it("does not flag a different tour that only shares destination and duration", async () => {
    const c = titicacaCandidate();
    const other = existingTour({ nameEs: "City tour Puno", nameEn: "Puno city tour", itinerary: [{ descriptionEs: "**09:00 a. m. | Catedral**\n\nVisita a la plaza de armas y la catedral.", descriptionEn: "" }] }, c);
    expect(await findDuplicateMatches(fakeDb([other]), c)).toEqual([]);
  });

  it("respects a reviewer's 'not the same tour', but never for a taken slug", async () => {
    const c = titicacaCandidate();
    c.dismissedDuplicates = [{ tourId: "tour-existing", reason: "El existente es de un día.", userId: "dev", at: "2026-11-02T00:00:00Z" }];
    expect(await findDuplicateMatches(fakeDb([existingTour({}, c)]), c)).toEqual([]);
    const [slugClash] = await findDuplicateMatches(fakeDb([existingTour({ slug: c.slug }, c)]), c);
    expect(slugClash).toMatchObject({ dismissible: false, score: 1 });
  });

  it("matches prices whether the existing tour stored the PDF, converted or published amount", async () => {
    const c = titicacaCandidate(); c.prices[0] = { ...c.prices[0], amount: 450, currency: "PEN" };
    for (const priceUsd of [120, 125.4]) {
      const [match] = await findDuplicateMatches(fakeDb([existingTour({ pricing: { tiers: [{ labelEs: "Adulto", priceUsd }] } }, c)]), c);
      expect(match.matchingFields).toContain("price");
    }
  });

  it("compares every related tour, not only the 80 oldest", async () => {
    const db = fakeDb([]);
    await findDuplicateMatches(db, titicacaCandidate());
    expect((db.tour.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0].take).toBeGreaterThanOrEqual(2000);
  });
});
