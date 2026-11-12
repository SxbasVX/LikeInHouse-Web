import { describe, expect, it } from "vitest";
import { normalizeCandidate, RULES_VERSION } from "../normalize";
import { validateCatalogTour } from "../validator";
import { issueKind, statusFromIssues } from "../severity";
import { readyCandidate } from "./fixtures";
import type { CatalogTourCandidate } from "../schemas";

const lists = { destinations: ["Cusco", "Cusco, Turismo comunitario", "La Paz", "Tumbes", "Uyuni"], categories: ["Aventura", "Cultura", "Naturaleza", "Gastronomía"] };
const price = (overrides: Partial<CatalogTourCandidate["prices"][number]>): CatalogTourCandidate["prices"][number] =>
  ({ labelEs: "Adulto", labelEn: "Adult", ageMin: null, ageMax: null, amount: 100, currency: "USD", priceType: "per_person", source: "document", ...overrides });
const kinds = (c: CatalogTourCandidate) => validateCatalogTour(c, lists).map((i) => `${issueKind(i)}:${i.field}`);
const fix = (c: CatalogTourCandidate, field: string) => c.autoFixes?.find((f) => f.field === field);

describe("automatic fixes before review", () => {
  it("leaves a clean candidate ready and stamps the rules version", () => {
    const c = normalizeCandidate(readyCandidate(), lists);
    expect(c.autoFixes).toBeUndefined();
    expect(c.rulesVersion).toBe(RULES_VERSION);
    expect(statusFromIssues(validateCatalogTour(c, lists), false)).toBe("READY");
  });

  it("is idempotent", () => {
    const messy = readyCandidate();
    Object.assign(messy, { destination: "Canoas de Punta Sal, Tumbes", category: "Avistamiento de fauna marina", difficulty: null, durationDays: null, durationNights: null, nameEs: "Full Day Punta Sal", nameEn: "Punta Sal Full Day" });
    messy.prices = [price({ serviceMode: "Compartido", minPassengers: 2 }), price({ labelEs: "Niño", labelEn: "Child", ageMax: 10, amount: 92, source: "derived", calculation: { baseAmount: 100, discount: 0.08, expression: "100 × 0.92" }, serviceMode: "Compartido", minPassengers: 2 })];
    const once = normalizeCandidate(messy, lists);
    expect(normalizeCandidate(once, lists)).toEqual(once);
  });

  it("maps the destination to the official city, asking for a tick only when it had to guess from the name", () => {
    const inside = readyCandidate(); inside.destination = "Canoas de Punta Sal, Tumbes";
    const a = normalizeCandidate(inside, lists);
    expect(a.destination).toBe("Tumbes");
    expect(fix(a, "destination")?.verify).toBe(false);

    const byName = readyCandidate(); Object.assign(byName, { destination: "Tiwanaku", nameEs: "Full Day Tiwanaku desde La Paz", durationDays: 1, durationNights: 0 });
    const b = normalizeCandidate(byName, lists);
    expect(b.destination).toBe("La Paz");
    expect(fix(b, "destination")?.verify).toBe(true);

    const exact = readyCandidate(); exact.destination = "cusco";
    expect(normalizeCandidate(exact, lists).destination).toBe("Cusco");
  });

  it("blocks a city that is not in the list instead of failing when the tour is created", () => {
    const c = readyCandidate(); Object.assign(c, { destination: "Tarapoto", nameEs: "Tarapoto Tropical", nameEn: "Tropical Tarapoto" });
    const normalized = normalizeCandidate(c, lists);
    expect(normalized.destination).toBe("Tarapoto");
    expect(kinds(normalized)).toContain("blocking:destination");
  });

  it("translates a free category to the official list, by alias or by content", () => {
    const alias = readyCandidate(); alias.category = "City tour";
    expect(normalizeCandidate(alias, lists).category).toBe("Cultura");
    const content = readyCandidate(); content.category = "Avistamiento de fauna marina";
    expect(normalizeCandidate(content, lists).category).toBe("Naturaleza");
    const unknown = readyCandidate(); Object.assign(unknown, { category: "Paquete turístico", nameEs: "Programa especial", nameEn: "Special program", shortDescEs: "Programa de tres días.", attractions: [] });
    expect(kinds(normalizeCandidate(unknown, lists))).toContain("blocking:category");
  });

  it("fills difficulty and the duration of full days, hour tours and ND/MN names", () => {
    const fullDay = readyCandidate(); Object.assign(fullDay, { nameEs: "Full Day Paracas", durationDays: null, durationNights: null, difficulty: null });
    expect(normalizeCandidate(fullDay, lists)).toMatchObject({ durationDays: 1, durationNights: 0, difficulty: "EASY" });
    const hours = readyCandidate(); Object.assign(hours, { nameEs: "Cholet Tour", nameEn: "Cholet Tour", durationDays: null, durationNights: null, durationHours: 3 });
    expect(normalizeCandidate(hours, lists)).toMatchObject({ durationDays: 0, durationNights: 0 });
    const named = readyCandidate(); Object.assign(named, { nameEs: "Tarapoto Tropical 4D/3N", durationDays: null, durationNights: null });
    const c = normalizeCandidate(named, lists);
    expect(c).toMatchObject({ durationDays: 4, durationNights: 3 });
    expect(kinds(c).filter((k) => !k.startsWith("info"))).toEqual([]);
  });

  it("moves service mode and passenger range into the rate label so the rate stops blocking", () => {
    const c = readyCandidate();
    c.prices = [price({ labelEs: "Precio del tour", labelEn: "Tour price", serviceMode: "Servicio compartido", minPassengers: 2 })];
    const normalized = normalizeCandidate(c, lists);
    expect(normalized.prices[0]).toMatchObject({ labelEs: "Precio del tour · Servicio compartido · desde 2 personas", serviceMode: null, minPassengers: null, maxPassengers: null });
    expect(normalized.informational).toBeFalsy();
    expect(kinds(normalized).some((k) => k.startsWith("blocking"))).toBe(false);
  });

  it("does not repeat in the label what it already says", () => {
    const c = readyCandidate();
    c.prices = [price({ labelEs: "Adulto · salida desde Tumbes · 2 a 3 personas", labelEn: "Adult · departing from Tumbes · 2 to 3 people", serviceMode: "Tour con salida desde Tumbes", minPassengers: 2, maxPassengers: 3 })];
    expect(normalizeCandidate(c, lists).prices[0].labelEs).toBe("Adulto · salida desde Tumbes · 2 a 3 personas");
  });

  it("publishes a rate grid as informational with the cheapest adult rate, and asks for one tick", () => {
    const c = readyCandidate();
    c.prices = ["Económico", "Turista", "Superior"].flatMap((hotel, h) => [
      price({ labelEs: `Hotel ${hotel} – Simple`, labelEn: `${hotel} hotel – Single`, amount: 520 + h * 100, currency: "PEN", priceType: "unknown", serviceMode: "Compartido" }),
      price({ labelEs: `Hotel ${hotel} – Triple`, labelEn: `${hotel} hotel – Triple`, amount: 390 + h * 100, currency: "PEN", priceType: "unknown", serviceMode: "Compartido" }),
      price({ labelEs: `Hotel ${hotel} – Niño (CHD)`, labelEn: `${hotel} hotel – Child (CHD)`, amount: 336 + h * 100, currency: "PEN", priceType: "unknown", serviceMode: "Compartido" }),
    ]);
    const normalized = normalizeCandidate(c, lists);
    expect(normalized.informational).toBe(true);
    expect(normalized.prices).toHaveLength(1);
    // The child rate is cheaper, but "desde" is the cheapest adult rate.
    expect(normalized.prices[0]).toMatchObject({ amount: 390, currency: "PEN", priceType: "per_person", serviceMode: null });
    expect(normalized.conditions?.at(-1)).toMatchObject({ titleEs: "Otras tarifas", titleEn: "Other rates" });
    expect(fix(normalized, "prices")?.verify).toBe(true);
    const found = kinds(normalized);
    expect(found.some((k) => k.startsWith("blocking"))).toBe(false);
    expect(found).toContain("warning:prices");
  });

  it("asks for a tick when it assumed the unit or folded a passenger minimum, never silently", () => {
    const noUnit = readyCandidate(); noUnit.prices = [price({ priceType: undefined })];
    expect(kinds(normalizeCandidate(noUnit, lists))).toContain("warning:prices.unit");
    const minimum = readyCandidate(); minimum.prices = [price({ minPassengers: 2 })];
    expect(kinds(normalizeCandidate(minimum, lists))).toContain("warning:prices.conditions");
    const modeOnly = readyCandidate(); modeOnly.prices = [price({ serviceMode: "Compartido" })];
    expect(kinds(normalizeCandidate(modeOnly, lists))).toContain("info:prices.conditions");
  });

  it("never picks a derived, resident-only or unconvertible rate as the public price", () => {
    const c = readyCandidate();
    c.provenance!["prices.4.amount"] = { source: "document", requiresReview: true, sourcePages: [2], evidence: null };
    c.prices = [
      price({ labelEs: "Adulto residente", labelEn: "Resident adult", amount: 50, serviceMode: "A" }),
      price({ labelEs: "Adulto promo", labelEn: "Promo adult", amount: 60, source: "derived", calculation: { baseAmount: 100, discount: 40, expression: "100 − 40" }, serviceMode: "A" }),
      price({ labelEs: "Adulto", labelEn: "Adult", amount: 70, currency: "EUR", serviceMode: "A" }),
      price({ labelEs: "Adulto", labelEn: "Adult", amount: 100, serviceMode: "A" }),
      price({ labelEs: "Adulto", labelEn: "Adult", amount: 150, serviceMode: "B" }),
    ];
    const normalized = normalizeCandidate(c, lists);
    expect(normalized.prices.map((p) => p.amount)).toEqual([100]);
    // Evidence keyed by the old positions must not attach itself to the rate that was kept.
    expect(Object.keys(normalized.provenance!).filter((key) => /^prices\.\d/.test(key))).toEqual([]);
  });

  it("respects rates the reviewer edited by hand", () => {
    const c = readyCandidate();
    c.prices = Array.from({ length: 8 }, (_, i) => price({ labelEs: `Opción ${i + 1}`, labelEn: `Option ${i + 1}`, amount: 100 + i }));
    c.provenance!.prices = { source: "manual", requiresReview: false, sourcePages: [2], evidence: "Revisado." };
    const normalized = normalizeCandidate(c, lists);
    expect(normalized.prices).toHaveLength(8);
    expect(normalized.provenance!.prices.source).toBe("manual");
  });

  it("asks for a tick when the PDF names two of the agency's cities", () => {
    const c = readyCandidate(); c.destination = "Cusco y La Paz";
    expect(fix(normalizeCandidate(c, lists), "destination")?.verify).toBe(true);
  });

  it("keeps a per-group rate blocked: a person must decide how to sell it", () => {
    const c = readyCandidate(); c.prices = [price({ priceType: "per_group" })];
    expect(kinds(normalizeCandidate(c, lists))).toContain("blocking:prices.0");
  });

  it("accepts a child discount stated as a percentage or a fraction", () => {
    for (const discount of [0.08, 8, 13.6]) {
      const c = readyCandidate();
      c.prices = [price({ amount: 170, currency: "PEN" }), price({ labelEs: "Niño", labelEn: "Child", ageMax: 10, amount: 156.4, currency: "PEN", source: "derived", calculation: { baseAmount: 170, discount, expression: "170 − 8 %" } })];
      expect(validateCatalogTour(c, lists).filter((i) => i.field.endsWith("calculation")), `discount ${discount}`).toEqual([]);
    }
    const wrong = readyCandidate();
    wrong.prices = [price({ amount: 170 }), price({ labelEs: "Niño", labelEn: "Child", amount: 120, source: "derived", calculation: { baseAmount: 170, discount: 8, expression: "170 − 8 %" } })];
    expect(validateCatalogTour(wrong, lists).some((i) => i.field.endsWith("calculation"))).toBe(true);
  });

  it("settles doubts it can check without the PDF, and trims an over-long short description", () => {
    const c = readyCandidate(); Object.assign(c, { nameEs: "Full Day Cusco", durationDays: 1, durationNights: 0, shortDescEs: `${"Recorrido cultural por Cusco con guía. ".repeat(6)}`.trim() });
    c.provenance!.durationNights = { source: "inferred", requiresReview: true, sourcePages: [2], evidence: null };
    const normalized = normalizeCandidate(c, lists);
    expect(normalized.provenance!.durationNights.requiresReview).toBe(false);
    expect(normalized.shortDescEs!.length).toBeLessThanOrEqual(160);
    expect(kinds(normalized).filter((k) => !k.startsWith("info"))).toEqual([]);
  });
});
