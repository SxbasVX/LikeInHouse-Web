/**
 * Formato de montos y fechas para el panel admin.
 *
 * Política de zona horaria:
 * - Fechas de viaje / salida (`travelDate`, `departureDate`, fechas sin hora):
 *   se guardan como medianoche UTC, así que se muestran en UTC para que el día
 *   no se corra al de antes en Lima (UTC-5).
 * - Marcas de tiempo (`createdAt`, `updatedAt`, eventos): se muestran en la
 *   hora de Lima, que es donde opera la agencia.
 */

export const ADMIN_LOCALE = "es-PE";
export const ADMIN_TIME_ZONE = "America/Lima";

type DateInput = Date | string | number;

function toDate(value: DateInput | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "US$ 1,234.50", "S/ 120.00". Si la moneda no es un código válido, cae a "XXX 1,234.50". */
export function formatMoney(
  amount: number | string | { toString(): string } | null | undefined,
  currency: string = "USD",
  options: { maximumFractionDigits?: number } = {},
): string {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const fractionDigits = options.maximumFractionDigits;
  try {
    return new Intl.NumberFormat(ADMIN_LOCALE, {
      style: "currency",
      currency,
      ...(fractionDigits !== undefined
        ? { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }
        : {}),
    }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(fractionDigits ?? 2)}`;
  }
}

/**
 * Fecha sin hora (viaje, salida). Por defecto en UTC; ver política arriba.
 * Devuelve `fallback` si la fecha falta o es inválida.
 */
export function formatDate(
  value: DateInput | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  fallback = "",
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(ADMIN_LOCALE, { timeZone: "UTC", ...options });
}

/** Fecha (sin hora) de una marca de tiempo, en hora de Lima. */
export function formatTimestampDate(
  value: DateInput | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  fallback = "",
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(ADMIN_LOCALE, { timeZone: ADMIN_TIME_ZONE, ...options });
}

/** Fecha y hora de una marca de tiempo, en hora de Lima. */
export function formatDateTime(
  value: DateInput | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  fallback = "",
): string {
  const date = toDate(value);
  if (!date) return fallback;
  // dateStyle/timeStyle no se pueden mezclar con year/month/hour...: sólo se
  // usan como valor por defecto cuando el llamador no pidió campos sueltos.
  const base: Intl.DateTimeFormatOptions = Object.keys(options).length
    ? options
    : { dateStyle: "short", timeStyle: "short" };
  return date.toLocaleString(ADMIN_LOCALE, { timeZone: ADMIN_TIME_ZONE, ...base });
}
