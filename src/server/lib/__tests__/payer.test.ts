import { describe, expect, it } from "vitest";
import { sanitizeAddress, sanitizeName, sanitizePhone, toCountryCode } from "../payer";

describe("toCountryCode", () => {
  it("mapea los valores del selector del checkout a ISO2", () => {
    expect(toCountryCode("Peru")).toBe("PE");
    expect(toCountryCode("USA")).toBe("US");
    expect(toCountryCode("UK")).toBe("GB");
    expect(toCountryCode("Mexico")).toBe("MX");
    expect(toCountryCode("Spain")).toBe("ES");
  });

  it("acepta nombres en español con tildes", () => {
    expect(toCountryCode("México")).toBe("MX");
    expect(toCountryCode("España")).toBe("ES");
    expect(toCountryCode("Japón")).toBe("JP");
  });

  it("es insensible a mayúsculas y espacios", () => {
    expect(toCountryCode("  peru  ")).toBe("PE");
    expect(toCountryCode("BRASIL")).toBe("BR");
  });

  it("deja pasar un ISO2 ya normalizado", () => {
    expect(toCountryCode("pe")).toBe("PE");
    expect(toCountryCode("DE")).toBe("DE");
  });

  it("cae a PE cuando el país falta o no se reconoce", () => {
    expect(toCountryCode(null)).toBe("PE");
    expect(toCountryCode(undefined)).toBe("PE");
    expect(toCountryCode("")).toBe("PE");
    expect(toCountryCode("Other")).toBe("PE");
  });
});

describe("sanitizeName", () => {
  it("conserva nombres válidos incluyendo tildes y compuestos", () => {
    expect(sanitizeName("María José")).toBe("María José");
    expect(sanitizeName("O'Brien")).toBe("O'Brien");
    expect(sanitizeName("Jean-Luc")).toBe("Jean-Luc");
  });

  it("quita dígitos y símbolos que las pasarelas rechazan", () => {
    expect(sanitizeName("Ana123")).toBe("Ana");
    expect(sanitizeName("Luis <script>")).toBe("Luis script");
  });

  it("colapsa espacios y recorta", () => {
    expect(sanitizeName("  Juan   Carlos  ")).toBe("Juan Carlos");
  });

  it("devuelve null en vez de un placeholder cuando no queda nada usable", () => {
    expect(sanitizeName(null)).toBeNull();
    expect(sanitizeName("")).toBeNull();
    expect(sanitizeName("A")).toBeNull();
    expect(sanitizeName("123")).toBeNull();
  });

  it("limita a 50 caracteres", () => {
    expect(sanitizeName("a".repeat(80))).toHaveLength(50);
  });
});

describe("sanitizePhone", () => {
  it("deja sólo dígitos", () => {
    expect(sanitizePhone("+51 913 406 888")).toBe("51913406888");
    expect(sanitizePhone("(084) 123-456")).toBe("084123456");
  });

  it("rechaza teléfonos demasiado cortos", () => {
    expect(sanitizePhone("12345")).toBeNull();
    expect(sanitizePhone(null)).toBeNull();
    expect(sanitizePhone("abc")).toBeNull();
  });

  it("limita a 15 dígitos conservando los últimos", () => {
    const result = sanitizePhone("1234567890123456789");
    expect(result).toHaveLength(15);
    expect(result).toBe("567890123456789");
  });
});

describe("sanitizeAddress", () => {
  it("normaliza espacios y saltos de línea", () => {
    expect(sanitizeAddress("Av. El Sol 456\nCusco")).toBe("Av. El Sol 456 Cusco");
  });

  it("rechaza direcciones por debajo del mínimo de Culqi (5 caracteres)", () => {
    expect(sanitizeAddress(null)).toBeNull();
    expect(sanitizeAddress("  ")).toBeNull();
    expect(sanitizeAddress("ab")).toBeNull();
    expect(sanitizeAddress("Av 1")).toBeNull();
    expect(sanitizeAddress("Av 12")).toBe("Av 12");
  });

  it("limita a 100 caracteres", () => {
    expect(sanitizeAddress("a".repeat(150))).toHaveLength(100);
  });
});
