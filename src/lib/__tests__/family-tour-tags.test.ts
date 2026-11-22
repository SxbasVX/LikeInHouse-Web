import { describe, expect, it } from "vitest";
import { familyTourTags } from "../family-tour-tags";

describe("familyTourTags", () => {
  it("no etiqueta tours que no son familiares", () => {
    expect(familyTourTags({ isFamily: false, difficulty: "EASY", minAge: 0 }, "es")).toEqual([]);
    expect(familyTourTags({ difficulty: "EASY" }, "es")).toEqual([]);
  });

  it("el ritmo sale de la dificultad real", () => {
    expect(familyTourTags({ isFamily: true, difficulty: "EASY" }, "es")).toEqual([{ label: "Ritmo tranquilo", tone: "pace" }]);
    expect(familyTourTags({ isFamily: true, difficulty: "CHALLENGING" }, "en")).toEqual([{ label: "Active pace", tone: "pace" }]);
    expect(familyTourTags({ isFamily: true, difficulty: "OTRA" }, "es")).toEqual([]);
  });

  it("'Para toda la familia' sólo con edad mínima 0 cargada", () => {
    expect(familyTourTags({ isFamily: true, minAge: 0 }, "es")[0].label).toBe("Para toda la familia");
    expect(familyTourTags({ isFamily: true, minAge: null }, "es")).toEqual([]);
  });

  it("'Ideal para niños' cuando el rango recomendado termina en la niñez", () => {
    expect(familyTourTags({ isFamily: true, recommendedAgeMax: 12 }, "es")[0].label).toBe("Ideal para niños");
    expect(familyTourTags({ isFamily: true, recommendedAgeMax: 15 }, "es")).toEqual([]);
  });
});
