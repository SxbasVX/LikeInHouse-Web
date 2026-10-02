import { describe, expect, it, afterEach } from "vitest";
import { verifyCatalogImportSecret } from "../secret";
import { validateCatalogTour } from "../validator";
import type { CatalogTourCandidate } from "../schemas";

const originalSecret = process.env.CATALOG_IMPORT_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CATALOG_IMPORT_SECRET;
  else process.env.CATALOG_IMPORT_SECRET = originalSecret;
});

const candidate: CatalogTourCandidate = {
  sourceDocument: "catalogo.pdf",
  sourcePages: [2, 3],
  slug: "cusco-tour",
  category: "Cultura",
  destination: "Cusco",
  difficulty: "EASY",
  durationDays: 2,
  durationNights: 1,
  durationHours: null,
  nameEs: "Tour Cusco",
  nameEn: "Cusco Tour",
  shortDescEs: "Descripción",
  shortDescEn: "Description",
  longDescEs: "Descripción larga",
  longDescEn: "Long description",
  metaTitleEs: null,
  metaDescEs: null,
  metaTitleEn: null,
  metaDescEn: null,
  prices: [{
    labelEs: "Adulto",
    labelEn: "Adult",
    ageMin: null,
    ageMax: null,
    amount: 100,
    currency: "USD",
  }],
  itinerary: [],
  includesEs: [],
  includesEn: [],
  excludesEs: [],
  excludesEn: [],
  conditionsEs: [],
  conditionsEn: [],
};

describe("AI Catalog Importer", () => {
  it("compara el secreto sin aceptar valores vacíos", () => {
    process.env.CATALOG_IMPORT_SECRET = "secret-seguro";
    expect(verifyCatalogImportSecret("secret-seguro")).toBe(true);
    expect(verifyCatalogImportSecret("secret-equivocado")).toBe(false);
    expect(verifyCatalogImportSecret("")).toBe(false);
  });

  it("marca datos faltantes como revisión", () => {
    const issues = validateCatalogTour({ ...candidate, longDescEs: null });
    expect(issues.some((issue) => issue.field === "longDescEs")).toBe(true);
    expect(issues.some((issue) => issue.type === "MISSING_REQUIRED")).toBe(true);
  });

  it("rechaza contradicciones de duración y monedas no cobrables", () => {
    const issues = validateCatalogTour({
      ...candidate,
      durationDays: 1,
      durationNights: 2,
      prices: [{ ...candidate.prices[0], currency: "PEN" }],
    });
    expect(issues.some((issue) => issue.type === "CONTRADICTION")).toBe(true);
    expect(issues.some((issue) => issue.field === "prices.0.currency")).toBe(true);
  });

  it("acepta candidatos completos con precio USD", () => {
    expect(validateCatalogTour(candidate)).toHaveLength(0);
  });
});
