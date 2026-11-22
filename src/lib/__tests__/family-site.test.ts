import { describe, it, expect } from "vitest";
import {
  FAMILY_PREVIEW_TOKEN_KEY,
  FAMILY_SITE_SETTING_KEY,
  isFamilyFaq,
  isFamilyHost,
  isFamilySitePublished,
  parseFamilySiteSetting,
} from "../family-site";
import { familyAgesError, tourUpdateSchema } from "../validators/tour";

describe("isFamilyHost", () => {
  it("reconoce el subdominio familiar en producción y en desarrollo", () => {
    expect(isFamilyHost("familia.likeinhouseperu.com")).toBe(true);
    expect(isFamilyHost("FAMILIA.likeinhouseperu.com")).toBe(true);
    expect(isFamilyHost("familia.localhost:3000")).toBe(true);
  });

  it("no confunde la web general, el panel ni dominios parecidos", () => {
    expect(isFamilyHost("likeinhouseperu.com")).toBe(false);
    expect(isFamilyHost("panel.likeinhouseperu.com")).toBe(false);
    expect(isFamilyHost("familia.likeinhouseperu.com.evil.com")).toBe(false);
    expect(isFamilyHost("")).toBe(false);
  });
});

describe("parseFamilySiteSetting", () => {
  it("queda en borrador si no hay ajustes", () => {
    expect(parseFamilySiteSetting({})).toEqual({ published: false, previewToken: null });
  });

  it("sólo cuenta como publicada con published === true", () => {
    expect(parseFamilySiteSetting({ [FAMILY_SITE_SETTING_KEY]: { published: true } }).published).toBe(true);
    expect(parseFamilySiteSetting({ [FAMILY_SITE_SETTING_KEY]: { published: "true" } }).published).toBe(false);
    expect(parseFamilySiteSetting({ [FAMILY_SITE_SETTING_KEY]: true }).published).toBe(false);
  });

  it("ignora tokens de vista previa demasiado cortos", () => {
    expect(parseFamilySiteSetting({ [FAMILY_PREVIEW_TOKEN_KEY]: "corto" }).previewToken).toBeNull();
    const token = "x".repeat(32);
    expect(parseFamilySiteSetting({ [FAMILY_PREVIEW_TOKEN_KEY]: token }).previewToken).toBe(token);
  });

  it("isFamilySitePublished tolera ajustes vacíos", () => {
    expect(isFamilySitePublished(undefined)).toBe(false);
    expect(isFamilySitePublished(null)).toBe(false);
    expect(isFamilySitePublished({ [FAMILY_SITE_SETTING_KEY]: { published: true } })).toBe(true);
  });
});

describe("familyAgesError", () => {
  it("acepta edades vacías o coherentes", () => {
    expect(familyAgesError({})).toBeNull();
    expect(familyAgesError({ minAge: 3, recommendedAgeMin: 4, recommendedAgeMax: 12 })).toBeNull();
    expect(familyAgesError({ recommendedAgeMin: 6, recommendedAgeMax: 6 })).toBeNull();
  });

  it("rechaza un rango invertido", () => {
    expect(familyAgesError({ recommendedAgeMin: 12, recommendedAgeMax: 4 })?.path).toBe("recommendedAgeMax");
  });

  it("rechaza una edad recomendada menor que la mínima", () => {
    expect(familyAgesError({ minAge: 5, recommendedAgeMin: 3 })?.path).toBe("recommendedAgeMin");
  });

  it("el esquema de edición limita las edades a 0-17", () => {
    expect(tourUpdateSchema.safeParse({ id: "t1", minAge: 18 }).success).toBe(false);
    expect(tourUpdateSchema.safeParse({ id: "t1", minAge: -1 }).success).toBe(false);
    expect(tourUpdateSchema.safeParse({ id: "t1", minAge: null, isFamily: true }).success).toBe(true);
  });
});

describe("isFamilyFaq", () => {
  it("acepta la categoría escrita de distintas formas", () => {
    expect(isFamilyFaq("familia")).toBe(true);
    expect(isFamilyFaq(" Familia ")).toBe(true);
    expect(isFamilyFaq("FAMILIA")).toBe(true);
  });
  it("las FAQ sin categoría o de otra categoría son de la web general", () => {
    expect(isFamilyFaq(null)).toBe(false);
    expect(isFamilyFaq("")).toBe(false);
    expect(isFamilyFaq("Pagos")).toBe(false);
  });
});
