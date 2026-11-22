import { describe, expect, it } from "vitest";
import { formatTourAges } from "../tour-ages";

describe("formatTourAges", () => {
  it("devuelve null sin datos de edad", () => {
    expect(formatTourAges({}, "es")).toBeNull();
    expect(formatTourAges({ minAge: null, recommendedAgeMin: null, recommendedAgeMax: null }, "en")).toBeNull();
  });

  it("trata la edad mínima 0 como sin restricción", () => {
    expect(formatTourAges({ minAge: 0 }, "es")).toBeNull();
  });

  it("muestra la edad mínima sola", () => {
    expect(formatTourAges({ minAge: 3 }, "es")).toBe("Disponible desde los 3 años");
    expect(formatTourAges({ minAge: 3 }, "en")).toBe("Available for ages 3 and up");
  });

  it("muestra el rango recomendado", () => {
    expect(formatTourAges({ recommendedAgeMin: 4, recommendedAgeMax: 12 }, "es")).toBe("Recomendado para niños de 4 a 12 años");
    expect(formatTourAges({ recommendedAgeMin: 4, recommendedAgeMax: 12 }, "en")).toBe("Recommended for ages 4–12");
    // Si llega a la adolescencia no dice "niños"
    expect(formatTourAges({ recommendedAgeMin: 10, recommendedAgeMax: 17 }, "es")).toBe("Recomendado de 10 a 17 años");
  });

  it("ordena un rango invertido", () => {
    expect(formatTourAges({ recommendedAgeMin: 12, recommendedAgeMax: 4 }, "es")).toBe("Recomendado para niños de 4 a 12 años");
  });

  it("maneja rangos abiertos y de una sola edad", () => {
    expect(formatTourAges({ recommendedAgeMin: 6 }, "es")).toBe("Recomendado desde los 6 años");
    expect(formatTourAges({ recommendedAgeMin: 6 }, "en")).toBe("Recommended for ages 6 and up");
    expect(formatTourAges({ recommendedAgeMax: 10 }, "es")).toBe("Recomendado hasta los 10 años");
    expect(formatTourAges({ recommendedAgeMax: 10 }, "en")).toBe("Recommended for ages up to 10");
    expect(formatTourAges({ recommendedAgeMin: 8, recommendedAgeMax: 8 }, "es")).toBe("Recomendado para 8 años");
  });

  it("prefiere el rango recomendado en la tarjeta", () => {
    expect(formatTourAges({ minAge: 3, recommendedAgeMin: 4, recommendedAgeMax: 12 }, "es")).toBe("Recomendado para niños de 4 a 12 años");
  });

  it("agrega la edad mínima en la ficha cuando aporta", () => {
    const tour = { minAge: 3, recommendedAgeMin: 4, recommendedAgeMax: 12 };
    expect(formatTourAges(tour, "es", { withMinimum: true })).toBe("Recomendado para niños de 4 a 12 años (disponible desde los 3 años)");
    expect(formatTourAges(tour, "en", { withMinimum: true })).toBe("Recommended for ages 4–12 (available for ages 3 and up)");
    // Si la mínima no es menor que el rango, no se repite
    expect(formatTourAges({ minAge: 5, recommendedAgeMin: 4, recommendedAgeMax: 12 }, "es", { withMinimum: true })).toBe("Recomendado para niños de 4 a 12 años");
  });

  it("ignora valores inválidos", () => {
    expect(formatTourAges({ minAge: -2, recommendedAgeMin: Number.NaN }, "es")).toBeNull();
  });
});

describe("formatTourAges con isFamily", () => {
  it("no muestra edades si el tour dejó de ser familiar", () => {
    expect(formatTourAges({ isFamily: false, recommendedAgeMin: 4, recommendedAgeMax: 12 }, "es")).toBeNull();
  });
  it("las muestra si es familiar o si el dato no viene", () => {
    expect(formatTourAges({ isFamily: true, recommendedAgeMin: 4, recommendedAgeMax: 12 }, "es")).not.toBeNull();
    expect(formatTourAges({ recommendedAgeMin: 4, recommendedAgeMax: 12 }, "es")).not.toBeNull();
  });
});
