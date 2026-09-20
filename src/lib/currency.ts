/**
 * Capa central de monedas.
 *
 * REGLA FUNDAMENTAL DEL SISTEMA
 * ─────────────────────────────
 * - Moneda BASE   : USD. Todo precio real y todo cálculo (descuentos,
 *                   impuestos, comisiones) ocurre en USD.
 * - Moneda de VISUALIZACIÓN: la que elige el pasajero. Es informativa.
 * - Moneda de COBRO: USD, siempre. Las pasarelas jamás reciben el importe
 *                   convertido.
 *
 * Nada fuera de este archivo debe convertir, redondear ni formatear dinero:
 * si necesitas mostrar un precio, usa `convertFromUSD` + `formatCurrency`
 * (o el hook `useCurrency`, que ya los encadena).
 */

export const BASE_CURRENCY = "USD" as const;

/** Moneda en la que se cobra SIEMPRE, independientemente de lo que se muestre. */
export const PAYMENT_CURRENCY = "USD" as const;

export type CurrencyCode =
  | "USD"
  | "PEN"
  | "EUR"
  | "MXN"
  | "COP"
  | "CLP"
  | "ARS"
  | "BRL"
  | "GBP";

export interface CurrencyDef {
  code: CurrencyCode;
  /** Símbolo corto para etiquetas compactas (tarjetas, badges). */
  symbol: string;
  nameEs: string;
  nameEn: string;
  /** Decimales que admite la moneda. CLP/COP/ARS no usan céntimos. */
  decimals: number;
  /** Locale con el que Intl formatea esta moneda de forma natural. */
  intlLocale: string;
}

/**
 * Catálogo de monedas soportadas para VISUALIZACIÓN.
 * Añadir una moneda nueva es añadir una entrada aquí: el selector, el
 * formateo y la conversión la recogen automáticamente. Lo único externo que
 * hace falta es que el proveedor de tipos de cambio devuelva su código.
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  USD: { code: "USD", symbol: "$",   nameEs: "Dólar estadounidense", nameEn: "US Dollar",       decimals: 2, intlLocale: "en-US" },
  PEN: { code: "PEN", symbol: "S/",  nameEs: "Sol peruano",          nameEn: "Peruvian Sol",    decimals: 2, intlLocale: "es-PE" },
  EUR: { code: "EUR", symbol: "€",   nameEs: "Euro",                 nameEn: "Euro",            decimals: 2, intlLocale: "es-ES" },
  MXN: { code: "MXN", symbol: "MX$", nameEs: "Peso mexicano",        nameEn: "Mexican Peso",    decimals: 2, intlLocale: "es-MX" },
  COP: { code: "COP", symbol: "COL$",nameEs: "Peso colombiano",      nameEn: "Colombian Peso",  decimals: 0, intlLocale: "es-CO" },
  CLP: { code: "CLP", symbol: "CLP$",nameEs: "Peso chileno",         nameEn: "Chilean Peso",    decimals: 0, intlLocale: "es-CL" },
  ARS: { code: "ARS", symbol: "AR$", nameEs: "Peso argentino",       nameEn: "Argentine Peso",  decimals: 0, intlLocale: "es-AR" },
  BRL: { code: "BRL", symbol: "R$",  nameEs: "Real brasileño",       nameEn: "Brazilian Real",  decimals: 2, intlLocale: "pt-BR" },
  GBP: { code: "GBP", symbol: "£",   nameEs: "Libra esterlina",      nameEn: "British Pound",   decimals: 2, intlLocale: "en-GB" },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

/** Normaliza cualquier entrada a una moneda válida; si no lo es, USD. */
export function toCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : BASE_CURRENCY;
}

/** Mapa de tipos de cambio con USD como base: { PEN: 3.75, EUR: 0.92, ... } */
export type ExchangeRates = Partial<Record<CurrencyCode, number>>;

/**
 * Tasas de emergencia. Sólo se usan si el proveedor de tipos de cambio no
 * responde: es preferible mostrar una cifra aproximada y desactualizada que
 * romper la página, porque esta cifra NUNCA se cobra.
 */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  PEN: 3.75,
  EUR: 0.92,
  MXN: 18.5,
  COP: 4100,
  CLP: 950,
  ARS: 1000,
  BRL: 5.4,
  GBP: 0.79,
};

/** Tipo de cambio USD→moneda, con degradación a la tasa de emergencia. */
export function getRate(currency: CurrencyCode, rates?: ExchangeRates): number {
  if (currency === BASE_CURRENCY) return 1;
  const rate = rates?.[currency];
  if (typeof rate === "number" && isFinite(rate) && rate > 0) return rate;
  return FALLBACK_RATES[currency];
}

/**
 * Convierte un importe USD a la moneda de visualización.
 *
 * El resultado es SÓLO para mostrar. Nunca debe volver al servidor como
 * importe a cobrar ni servir de base para otro cálculo financiero: los
 * descuentos, impuestos y comisiones se aplican antes, en USD.
 */
export function convertFromUSD(
  amountUsd: number,
  target: CurrencyCode,
  rates?: ExchangeRates
): number {
  if (!isFinite(amountUsd)) return 0;
  const converted = amountUsd * getRate(target, rates);
  return roundForCurrency(converted, target);
}

/** Redondeo al número de decimales que admite la moneda. */
export function roundForCurrency(amount: number, currency: CurrencyCode): number {
  const factor = Math.pow(10, CURRENCIES[currency].decimals);
  return Math.round(amount * factor) / factor;
}

interface FormatOptions {
  /** "es" | "en" — idioma de la interfaz. Sin él se usa el locale de la moneda. */
  locale?: string;
  /** Oculta los decimales aunque la moneda los admita (tarjetas de catálogo). */
  compact?: boolean;
  /** Antepone el código ISO: "USD $100.00". Útil donde debe quedar inequívoco. */
  withCode?: boolean;
}

/**
 * Formatea un importe YA convertido. No convierte: si le pasas USD y le pides
 * PEN, escribirá el número en USD con símbolo de soles.
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  options: FormatOptions = {}
): string {
  const def = CURRENCIES[currency];
  const decimals = options.compact ? 0 : def.decimals;
  const intlLocale = options.locale === "en" ? "en-US" : options.locale === "es" ? def.intlLocale : def.intlLocale;

  let body: string;
  try {
    body = new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(isFinite(amount) ? amount : 0);
  } catch {
    // Intl puede no conocer narrowSymbol en runtimes viejos: formateo manual.
    const n = (isFinite(amount) ? amount : 0).toFixed(decimals);
    body = `${def.symbol} ${n}`;
  }

  return options.withCode ? `${currency} ${body}` : body;
}

/** Atajo: convierte desde USD y formatea en un solo paso. */
export function formatFromUSD(
  amountUsd: number,
  currency: CurrencyCode,
  rates?: ExchangeRates,
  options: FormatOptions = {}
): string {
  return formatCurrency(convertFromUSD(amountUsd, currency, rates), currency, options);
}

/**
 * País (ISO-3166 alpha-2) → moneda SUGERIDA.
 * Sólo es una sugerencia inicial: la elección manual del pasajero siempre
 * manda y se persiste. Un país que no esté aquí cae en USD.
 */
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  PE: "PEN",
  MX: "MXN",
  CO: "COP",
  CL: "CLP",
  AR: "ARS",
  BR: "BRL",
  GB: "GBP",
  US: "USD", EC: "USD", PA: "USD", SV: "USD",
  // Zona euro
  ES: "EUR", DE: "EUR", FR: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", BE: "EUR",
  AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR", SK: "EUR", SI: "EUR", LT: "EUR",
  LV: "EUR", EE: "EUR", LU: "EUR", MT: "EUR", CY: "EUR", HR: "EUR",
};

/** Moneda sugerida para un país. Sin país determinable → USD. */
export function currencyForCountry(country?: string | null): CurrencyCode {
  if (!country) return BASE_CURRENCY;
  return COUNTRY_CURRENCY[country.trim().toUpperCase()] ?? BASE_CURRENCY;
}
