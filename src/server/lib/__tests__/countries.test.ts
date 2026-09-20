import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  dialCodeFor,
  isPhoneJustPrefix,
  phoneForCountry,
} from "@/lib/countries";
import { toCountryCode } from "@/server/lib/payer";

describe("Catálogo de países", () => {
  it("todo país tiene valor estable, etiquetas y prefijo (salvo 'Other')", () => {
    for (const c of COUNTRIES) {
      expect(c.value.length).toBeGreaterThan(0);
      expect(c.labelEs.length).toBeGreaterThan(0);
      expect(c.labelEn.length).toBeGreaterThan(0);
      if (c.value !== "Other") expect(c.dial).toMatch(/^\+\d{1,4}$/);
    }
  });

  it("no hay valores duplicados", () => {
    const values = COUNTRIES.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("cada valor del selector lo reconoce el mapeo de las pasarelas", () => {
    // Si alguien añade un país al catálogo sin darlo de alta en payer.ts, las
    // pasarelas recibirían "PE" por defecto y el antifraude vería un país que
    // no es el del cliente.
    for (const c of COUNTRIES) {
      if (c.value === "Other") continue;
      const iso = toCountryCode(c.value);
      expect(iso).toMatch(/^[A-Z]{2}$/);
      if (c.value !== "Peru") expect(iso).not.toBe("PE");
    }
  });
});

describe("Prefijo telefónico según el país", () => {
  it("devuelve el prefijo correcto", () => {
    expect(dialCodeFor("Peru")).toBe("+51");
    expect(dialCodeFor("Spain")).toBe("+34");
    expect(dialCodeFor("USA")).toBe("+1");
    expect(dialCodeFor("Other")).toBe("");
    expect(dialCodeFor(null)).toBe("");
    expect(dialCodeFor("Narnia")).toBe("");
  });

  it("rellena el prefijo cuando el campo está vacío", () => {
    expect(phoneForCountry("Peru", "")).toBe("+51 ");
    expect(phoneForCountry("Spain", null)).toBe("+34 ");
    expect(phoneForCountry("Germany", "   ")).toBe("+49 ");
  });

  it("cambia el prefijo si el viajero aún no escribió su número", () => {
    expect(phoneForCountry("Spain", "+51")).toBe("+34 ");
    expect(phoneForCountry("Spain", "+51 ")).toBe("+34 ");
  });

  it("NUNCA pisa un número ya tecleado", () => {
    expect(phoneForCountry("Spain", "+51 987654321")).toBeNull();
    expect(phoneForCountry("Peru", "987654321")).toBeNull();
    expect(phoneForCountry("Peru", "+44 7700 900000")).toBeNull();
  });

  it("'Otro' no toca el campo: el viajero escribe su prefijo", () => {
    expect(phoneForCountry("Other", "")).toBeNull();
    expect(phoneForCountry("Other", "+998 123456")).toBeNull();
  });

  it("detecta correctamente un campo que sólo tiene prefijo", () => {
    expect(isPhoneJustPrefix("")).toBe(true);
    expect(isPhoneJustPrefix("+51")).toBe(true);
    expect(isPhoneJustPrefix("+591")).toBe(true);
    expect(isPhoneJustPrefix("+51 9")).toBe(false);
    expect(isPhoneJustPrefix("999888777")).toBe(false);
  });
});
