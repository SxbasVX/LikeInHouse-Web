import { describe, expect, it } from "vitest";
import { normalizeDestinationList } from "../tour-destinations";

describe("normalizeDestinationList", () => {
  it("limpia espacios, quita vacíos y duplicados sin importar mayúsculas", () => {
    expect(normalizeDestinationList(["  Puno ", "puno", "", "Cusco", "Machu   Picchu"])).toEqual([
      "Cusco",
      "Machu Picchu",
      "Puno",
    ]);
  });

  it("ordena alfabéticamente en español", () => {
    expect(normalizeDestinationList(["Ica", "Arequipa", "Ñaña", "Nazca"])).toEqual([
      "Arequipa",
      "Ica",
      "Nazca",
      "Ñaña",
    ]);
  });
});
