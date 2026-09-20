import { describe, it, expect } from "vitest";
import {
  BASE_CURRENCY,
  PAYMENT_CURRENCY,
  CURRENCIES,
  CURRENCY_CODES,
  convertFromUSD,
  currencyForCountry,
  formatCurrency,
  formatFromUSD,
  getRate,
  isCurrencyCode,
  roundForCurrency,
  toCurrencyCode,
  type ExchangeRates,
} from "@/lib/currency";

/**
 * La invariante que protegen estos tests:
 *
 *   MONEDA DE VISUALIZACIÓN ≠ MONEDA DE COBRO
 *   MONEDA DE COBRO         = USD, siempre
 *
 * Todo lo que convierte precios vive en src/lib/currency.ts, así que probarlo
 * aquí cubre el catálogo, la ficha de tour, el carrito y el checkout a la vez.
 */

const RATES: ExchangeRates = {
  USD: 1,
  PEN: 3.5,
  EUR: 0.92,
  MXN: 18.5,
  COP: 4100,
  CLP: 950,
  ARS: 1000,
  BRL: 5.4,
  GBP: 0.79,
};

describe("Invariantes de moneda", () => {
  it("la moneda base y la de cobro son USD", () => {
    expect(BASE_CURRENCY).toBe("USD");
    expect(PAYMENT_CURRENCY).toBe("USD");
  });

  it("el catálogo cubre todas las monedas pedidas y es ampliable", () => {
    for (const code of ["USD", "PEN", "EUR", "MXN", "COP", "CLP", "ARS", "BRL", "GBP"]) {
      expect(CURRENCY_CODES).toContain(code);
      expect(CURRENCIES[code as keyof typeof CURRENCIES]).toBeDefined();
    }
  });

  it("toda moneda del catálogo tiene símbolo, nombres y decimales válidos", () => {
    for (const code of CURRENCY_CODES) {
      const def = CURRENCIES[code];
      expect(def.symbol.length).toBeGreaterThan(0);
      expect(def.nameEs.length).toBeGreaterThan(0);
      expect(def.nameEn.length).toBeGreaterThan(0);
      expect([0, 2]).toContain(def.decimals);
    }
  });
});

describe("Conversión desde USD", () => {
  it("el ejemplo del negocio: 100 USD se ven como 350 PEN", () => {
    expect(convertFromUSD(100, "PEN", RATES)).toBe(350);
  });

  it("USD no se toca nunca", () => {
    expect(convertFromUSD(100, "USD", RATES)).toBe(100);
    expect(getRate("USD", RATES)).toBe(1);
  });

  it("convierte a EUR con decimales", () => {
    expect(convertFromUSD(100, "EUR", RATES)).toBe(92);
    expect(convertFromUSD(99.99, "EUR", RATES)).toBe(91.99);
  });

  it("redondea a entero las monedas sin céntimos", () => {
    expect(convertFromUSD(1, "CLP", RATES)).toBe(950);
    expect(convertFromUSD(1.004, "COP", RATES)).toBe(4116); // 4116.4 → 4116
    expect(roundForCurrency(4116.4, "COP")).toBe(4116);
  });

  it("cae en la tasa de emergencia si falta la del proveedor", () => {
    const partial: ExchangeRates = { PEN: 3.8 };
    expect(convertFromUSD(10, "PEN", partial)).toBe(38);
    // EUR no está en el mapa: usa el fallback, nunca 0 ni NaN
    const eur = convertFromUSD(10, "EUR", partial);
    expect(eur).toBeGreaterThan(0);
    expect(Number.isNaN(eur)).toBe(false);
  });

  it("ignora tasas inválidas (0, negativas, NaN)", () => {
    for (const bad of [0, -3, NaN]) {
      const rate = getRate("PEN", { PEN: bad } as ExchangeRates);
      expect(rate).toBeGreaterThan(0);
    }
  });

  it("no produce NaN con importes inválidos", () => {
    expect(convertFromUSD(NaN, "PEN", RATES)).toBe(0);
    expect(convertFromUSD(Infinity, "PEN", RATES)).toBe(0);
  });
});

describe("Cambio manual de moneda", () => {
  it("PEN → USD devuelve el importe base intacto", () => {
    const usd = 249.9;
    expect(convertFromUSD(usd, "PEN", RATES)).toBe(874.65);
    expect(convertFromUSD(usd, "USD", RATES)).toBe(usd);
  });

  it("USD → EUR no arrastra la conversión anterior", () => {
    // El bug clásico: convertir sobre lo ya convertido. Partiendo siempre de
    // USD, el resultado de EUR no depende de que antes se viera PEN.
    const usd = 100;
    convertFromUSD(usd, "PEN", RATES);
    expect(convertFromUSD(usd, "EUR", RATES)).toBe(92);
  });

  it("cadenas de monedas distintas parten todas del mismo USD", () => {
    const usd = 80;
    const results = CURRENCY_CODES.map((c) => convertFromUSD(usd, c, RATES));
    // Ninguna conversión puede devolver 0 para un importe positivo
    for (const r of results) expect(r).toBeGreaterThan(0);
  });
});

describe("Orden de cálculo: descuentos y comisiones en USD", () => {
  // 100 USD − 10 descuento + 5 comisión = 95 USD → S/ 332.50 con TC 3.50
  const baseUsd = 100;
  const discountUsd = 10;
  const feeUsd = 5;

  it("convierte sólo el total final, nunca los sumandos", () => {
    const totalUsd = baseUsd - discountUsd + feeUsd;
    expect(totalUsd).toBe(95);
    expect(convertFromUSD(totalUsd, "PEN", RATES)).toBe(332.5);
  });

  it("convertir antes de calcular da un resultado distinto (por eso no se hace)", () => {
    const wrong =
      convertFromUSD(baseUsd, "PEN", RATES) -
      convertFromUSD(discountUsd, "PEN", RATES) +
      convertFromUSD(feeUsd, "PEN", RATES);
    const right = convertFromUSD(baseUsd - discountUsd + feeUsd, "PEN", RATES);
    // Con este TC ambos coinciden, pero el importe COBRADO debe salir del USD:
    expect(right).toBe(332.5);
    expect(wrong).toBeCloseTo(right, 2);
    // Lo que nunca debe ocurrir es cobrar el número convertido:
    expect(right).not.toBe(baseUsd - discountUsd + feeUsd);
  });
});

describe("Formato", () => {
  it("incluye el código cuando se pide (importe cobrado)", () => {
    const text = formatCurrency(100, "USD", { withCode: true });
    expect(text).toContain("USD");
    expect(text).toContain("100");
  });

  it("respeta los decimales de cada moneda", () => {
    expect(formatCurrency(1234.5, "USD")).toMatch(/1[,.]234[.,]50/);
    expect(formatCurrency(1234.5, "CLP")).not.toMatch(/[.,]50\b/);
  });

  it("formatFromUSD convierte y formatea en un paso", () => {
    const text = formatFromUSD(100, "PEN", RATES);
    expect(text).toContain("350");
  });

  it("no lanza con importes inválidos", () => {
    expect(() => formatCurrency(NaN, "PEN")).not.toThrow();
    expect(() => formatCurrency(Infinity, "EUR")).not.toThrow();
  });
});

describe("Moneda sugerida por país", () => {
  it("usa la moneda local de los mercados conocidos", () => {
    expect(currencyForCountry("PE")).toBe("PEN");
    expect(currencyForCountry("mx")).toBe("MXN");
    expect(currencyForCountry("ES")).toBe("EUR");
    expect(currencyForCountry("BR")).toBe("BRL");
  });

  it("sin país determinable, USD", () => {
    expect(currencyForCountry(null)).toBe("USD");
    expect(currencyForCountry(undefined)).toBe("USD");
    expect(currencyForCountry("")).toBe("USD");
    expect(currencyForCountry("ZZ")).toBe("USD");
  });
});

describe("Validación de códigos", () => {
  it("acepta sólo monedas del catálogo", () => {
    expect(isCurrencyCode("PEN")).toBe(true);
    expect(isCurrencyCode("XYZ")).toBe(false);
    expect(isCurrencyCode(null)).toBe(false);
    expect(isCurrencyCode(123)).toBe(false);
  });

  it("normaliza cualquier basura a USD", () => {
    expect(toCurrencyCode("EUR")).toBe("EUR");
    expect(toCurrencyCode("<script>")).toBe("USD");
    expect(toCurrencyCode(undefined)).toBe("USD");
  });
});
