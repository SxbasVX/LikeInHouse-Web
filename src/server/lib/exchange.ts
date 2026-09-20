import "server-only";
import {
  CURRENCY_CODES,
  FALLBACK_RATES,
  type CurrencyCode,
  type ExchangeRates,
} from "@/lib/currency";

/**
 * Tipos de cambio del servidor.
 *
 * Son SÓLO para visualización: el cobro es siempre en USD, así que un tipo de
 * cambio desactualizado nunca puede traducirse en un importe cobrado
 * incorrecto. Aun así el navegador no decide la tasa — la pide aquí — para
 * que lo que se guarda en la reserva (`exchangeRate`) sea auditable.
 */

/**
 * Tipo de cambio oficial SUNAT (vía apis.net.pe).
 *
 * Se usa el tipo "venta": es lo que efectivamente paga el cliente cuando su
 * banco convierte, así que es la cifra más cercana a lo que verá en su
 * estado de cuenta. El "compra" subestimaría el precio mostrado.
 */
export async function getUsdToPenRate(): Promise<number> {
  const FALLBACK = parseFloat(process.env.USD_TO_PEN_RATE_FALLBACK || String(FALLBACK_RATES.PEN));
  try {
    const res = await fetch("https://api.apis.net.pe/v1/tipo-cambio-sunat", {
      next: { revalidate: 14400 }, // caché Next.js: 4 horas
      headers: { Accept: "application/json", Referer: "https://likeinhouse.com" },
    });
    if (!res.ok) return FALLBACK;
    // { origen: "SUNAT", compra: 3.389, venta: 3.399, moneda: "USD", fecha: "2026-04-09" }
    const data = await res.json();
    const rate = parseFloat(data?.venta ?? "");
    return isNaN(rate) || rate <= 0 ? FALLBACK : rate;
  } catch {
    return FALLBACK;
  }
}

/**
 * Resto de monedas: open.er-api.com, gratuito y sin API key, base USD.
 * Devuelve {} si falla; el llamador completa con las tasas de emergencia.
 */
async function fetchOpenRates(): Promise<ExchangeRates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 14400 }, // 4 horas
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (data?.result !== "success" || typeof data?.rates !== "object") return {};

    const out: ExchangeRates = {};
    for (const code of CURRENCY_CODES) {
      const value = Number(data.rates[code]);
      if (isFinite(value) && value > 0) out[code] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export interface ExchangeRatesResult {
  base: "USD";
  rates: Record<CurrencyCode, number>;
  /** Origen efectivo de cada tasa, para diagnosticar en producción. */
  sources: { pen: "SUNAT" | "fallback"; others: "open.er-api.com" | "fallback" };
  fetchedAt: string;
}

/**
 * Todas las tasas USD→X que necesita el front, en una sola llamada.
 * PEN siempre viene de SUNAT (tipo venta) porque es la tasa oficial que
 * esperan los clientes peruanos; el resto, del proveedor general.
 */
export async function getExchangeRates(): Promise<ExchangeRatesResult> {
  const [penRate, openRates] = await Promise.all([getUsdToPenRate(), fetchOpenRates()]);

  const rates = { ...FALLBACK_RATES } as Record<CurrencyCode, number>;
  for (const [code, value] of Object.entries(openRates)) {
    rates[code as CurrencyCode] = value as number;
  }
  rates.USD = 1;
  rates.PEN = penRate; // SUNAT manda sobre el proveedor general

  const penFromFallback = penRate === parseFloat(process.env.USD_TO_PEN_RATE_FALLBACK || String(FALLBACK_RATES.PEN));

  return {
    base: "USD",
    rates,
    sources: {
      pen: penFromFallback ? "fallback" : "SUNAT",
      others: Object.keys(openRates).length > 0 ? "open.er-api.com" : "fallback",
    },
    fetchedAt: new Date().toISOString(),
  };
}

/** Tasa puntual USD→moneda, resuelta en el servidor. */
export async function getRateFor(currency: CurrencyCode): Promise<number> {
  if (currency === "USD") return 1;
  if (currency === "PEN") return getUsdToPenRate();
  const { rates } = await getExchangeRates();
  return rates[currency] ?? FALLBACK_RATES[currency];
}
