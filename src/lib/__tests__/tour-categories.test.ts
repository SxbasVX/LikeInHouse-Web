import { describe, expect, it } from "vitest";
import { DEFAULT_TOUR_CATEGORIES, joinCategories, mapLegacyCategory, splitCategories } from "../tour-categories";

const official = DEFAULT_TOUR_CATEGORIES;

describe("mapLegacyCategory", () => {
  it.each([
    ["Cultural", ["Cultura"]],
    ["Naturaleza", ["Naturaleza"]],
    ["aventura y naturaleza", ["Aventura", "Naturaleza"]],
    ["Naturaleza y aventura", ["Aventura", "Naturaleza"]],
    ["Cultural, Naturaleza", ["Cultura", "Naturaleza"]],
    ["Cultural y Naturaleza", ["Cultura", "Naturaleza"]],
    ["Naturaleza, cultura y sabor", ["Cultura", "Naturaleza", "Gastronomía"]],
    ["Naturaleza y sabor", ["Naturaleza", "Gastronomía"]],
    ["City Tour", ["Cultura"]],
    ["Tour Gastronómico", ["Gastronomía"]],
    ["Cena Show", ["Cultura", "Gastronomía"]],
  ])("%s → %j", (input, expected) => {
    expect(mapLegacyCategory(input, official)).toEqual({ categories: expected, unknown: [] });
  });

  it("reporta lo que no reconoce", () => {
    expect(mapLegacyCategory("Cultural y Playa", official)).toEqual({ categories: ["Cultura"], unknown: ["Playa"] });
  });
});

describe("splitCategories / joinCategories", () => {
  it("separa y une respetando el orden oficial sin duplicados", () => {
    expect(splitCategories("Naturaleza, Cultura")).toEqual(["Naturaleza", "Cultura"]);
    expect(joinCategories(["Naturaleza", "Cultura", "Cultura"], official)).toBe("Cultura, Naturaleza");
    expect(splitCategories("")).toEqual([]);
  });
});
