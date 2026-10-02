import { afterEach, describe, expect, it, vi } from "vitest";
import { readyCandidate } from "./fixtures";
import { validateCatalogTour, validTime } from "../validator";
import { draftCreateData } from "../draft";
import { renderItineraryDay } from "../editorial";
import { createAccessGrant, verifyAccessGrant, createPreviewToken, verifyPreviewToken } from "../secret";
import { catalogExtractionEnvelopeSchema, catalogTourCandidateSchema } from "../schemas";
import { parseItineraryDescription } from "@/lib/utils";
import { allowedDocumentUrl, downloadCatalogPdf } from "../documents";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("editorial validation and draft safety", () => {
  it("renders separate activities through the unchanged public renderer", () => {
    const c = readyCandidate();
    const blocks = parseItineraryDescription(renderItineraryDay(c.itinerary[0], "Es"));
    expect(blocks.map((b) => b.type)).toEqual(["heading", "paragraph", "heading", "paragraph"]);
    expect(blocks[0].text).toBe("08:00 | Recojo");
    expect(blocks[2].text).toBe("Recorrido");
    expect(renderItineraryDay(c.itinerary[0], "En")).toContain("Pickup");
  });
  it("always creates DRAFT, preserves conditions and never supplies image mutations", () => {
    const data = draftCreateData(readyCandidate());
    expect(data.status).toBe("DRAFT"); expect(data.images).toBeUndefined();
    expect(data.conditions).toMatchObject({ create: [{ textEn: "Documentation: Bring an identity document." }] });
    expect(data.pricing).not.toHaveProperty("create.basePriceUsdAdult");
    expect(data.includes).toMatchObject({ create: [{ textEn: "Transportation." }, { textEn: "Lunch." }] });
  });
  it.each(["per_group", "unknown"] as const)("blocks %s pricing without conversion", (priceType) => {
    const c = readyCandidate(); c.prices[0].priceType = priceType;
    expect(() => draftCreateData(c)).toThrow("revisión");
  });
  it("rejects unknown currency, inverted ages, inferred facts and oversized summaries", () => {
    const c = readyCandidate(); c.prices[0].currency = null; c.prices[0].ageMin = 12; c.prices[0].ageMax = 5;
    c.shortDescEn = "a".repeat(161); c.provenance!.difficulty.source = "inferred";
    expect(validateCatalogTour(c).map((i) => i.field)).toEqual(expect.arrayContaining(["prices.0.currency", "prices.0.ageMax", "difficulty", "shortDescEn"]));
  });
  it("verifies derived child prices against a documented base", () => {
    const c = readyCandidate(); c.prices.push({ ...c.prices[0], labelEs: "Niño", labelEn: "Child", ageMin: 5, ageMax: 12, amount: 97, source: "derived", calculation: { baseAmount: 100, discount: 3, expression: "100 - 3" } });
    expect(validateCatalogTour(c)).toHaveLength(0);
    c.prices[1].amount = 96;
    expect(validateCatalogTour(c).some((i) => i.field === "prices.1.calculation")).toBe(true);
  });
  it("preserves contradictions and refuses missing translations or repeated days", () => {
    const c = readyCandidate(); c.includesEn = []; c.itinerary.push(c.itinerary[0]);
    c.sourceIssues = [{ field: "weight", valueA: ">99 kg", valueB: ">100 kg", sourcePages: [2, 3], reason: "Límites distintos." }];
    expect(validateCatalogTour(c)).toEqual(expect.arrayContaining([expect.objectContaining({ field: "weight", valueA: ">99 kg", valueB: ">100 kg", type: "CONTRADICTION" })]));
    expect(() => draftCreateData(c)).toThrow();
  });
  it("keeps schedule text without inventing departures or capacity", () => {
    const c = readyCandidate(); c.schedule = { frequency: "selected_days", days: [2, 3, 4, 5, 6, 0], times: ["08:00", "14:00"], dates: [], notesEs: null, notesEn: null };
    const data = draftCreateData(c);
    expect(data.departures).toBeUndefined();
    expect(data.conditions).toMatchObject({ create: expect.arrayContaining([expect.objectContaining({ textEn: expect.stringContaining("14:00") })]) });
    c.schedule.dates = ["2026-10-15"];
    expect(validateCatalogTour(c).some((i) => i.field === "schedule.dates")).toBe(true);
  });
  it("does not reject valid sibling tours when one schema is invalid", () => {
    const result = catalogExtractionEnvelopeSchema.parse({ sourceDocument: "catalogo.pdf", tours: [{ bad: true }, readyCandidate()] });
    expect(result.tours.map((t) => catalogTourCandidateSchema.safeParse(t).success)).toEqual([false, true]);
  });
  it.each(["24:00", "08:60", "04:30 pm", "invented"])("rejects invalid time %s", (value) => expect(validTime(value)).toBe(false));
});

describe("temporary access and preview grants", () => {
  it("binds access to the user, expiry and backend secret", () => {
    vi.stubEnv("CATALOG_IMPORT_SECRET", "backend-only-code");
    const grant = createAccessGrant("developer", 1000);
    expect(grant).not.toContain("backend-only-code");
    expect(verifyAccessGrant(grant, "developer", 1001)).toBe(true);
    expect(verifyAccessGrant(grant, "admin", 1001)).toBe(false);
    expect(verifyAccessGrant(grant, "developer", 1_801_000)).toBe(false);
    expect(verifyAccessGrant(`${grant}x`, "developer", 1001)).toBe(false);
    vi.stubEnv("CATALOG_IMPORT_SECRET", "rotated");
    expect(verifyAccessGrant(grant, "developer", 1001)).toBe(false);
  });
  it("requires a fresh preview of the exact candidate data", () => {
    vi.stubEnv("CATALOG_IMPORT_SECRET", "backend-only-code");
    const c = readyCandidate(), token = createPreviewToken("developer", "candidate", c, 1000);
    expect(verifyPreviewToken(token, "developer", "candidate", c, 1001)).toBe(true);
    expect(verifyPreviewToken(token, "developer", "other", c, 1001)).toBe(false);
    expect(verifyPreviewToken(token, "developer", "candidate", { ...c, nameEs: "Changed" }, 1001)).toBe(false);
    expect(verifyPreviewToken(token, "developer", "candidate", c, 601000)).toBe(false);
  });
});

describe("bounded PDF downloads", () => {
  it("only accepts the configured Cloudinary catalog folder", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "our-cloud");
    expect(allowedDocumentUrl("https://res.cloudinary.com/our-cloud/raw/upload/v1/likesinhouse/catalog-imports/puno.pdf")).toBe(true);
    for (const url of ["https://evil.cloudinary.com/puno.pdf", "https://res.cloudinary.com/other/raw/upload/v1/likesinhouse/catalog-imports/puno.pdf", "http://res.cloudinary.com/our-cloud/raw/upload/likesinhouse/catalog-imports/puno.pdf", "https://res.cloudinary.com/our-cloud/image/upload/likesinhouse/catalog-imports/puno.pdf"]) expect(allowedDocumentUrl(url)).toBe(false);
  });
  it("checks the PDF signature instead of trusting its extension", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "our-cloud");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>error</html>")));
    await expect(downloadCatalogPdf("https://res.cloudinary.com/our-cloud/raw/upload/likesinhouse/catalog-imports/puno.pdf")).rejects.toThrow("PDF inválido");
  });
  it("enforces the actual size even without Content-Length", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "our-cloud");
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(20 * 1024 * 1024 + 1)); controller.close(); } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream)));
    await expect(downloadCatalogPdf("https://res.cloudinary.com/our-cloud/raw/upload/likesinhouse/catalog-imports/puno.pdf")).rejects.toThrow("20 MB");
  });
});
