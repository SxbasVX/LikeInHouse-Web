/**
 * Normalización de datos del pagador para las pasarelas (Culqi / PayPal).
 *
 * Ambas pasarelas usan estos datos en su motor antifraude. Enviar campos
 * vacíos, con placeholders o con el nombre del campo (ej. "last_name")
 * eleva el score de riesgo y la transacción se rechaza como sospechosa.
 */

/**
 * Mapea los valores del selector de país del checkout (ver
 * `checkout-form.tsx`) a códigos ISO 3166-1 alpha-2, que es lo que exigen
 * Culqi (`country_code`) y PayPal (`address.country_code`).
 */
const COUNTRY_TO_ISO2: Record<string, string> = {
  peru: "PE",
  argentina: "AR",
  bolivia: "BO",
  brasil: "BR",
  brazil: "BR",
  chile: "CL",
  colombia: "CO",
  ecuador: "EC",
  mexico: "MX",
  méxico: "MX",
  paraguay: "PY",
  uruguay: "UY",
  venezuela: "VE",
  usa: "US",
  "estados unidos": "US",
  "united states": "US",
  canada: "CA",
  canadá: "CA",
  spain: "ES",
  españa: "ES",
  france: "FR",
  francia: "FR",
  germany: "DE",
  alemania: "DE",
  uk: "GB",
  "reino unido": "GB",
  "united kingdom": "GB",
  italy: "IT",
  italia: "IT",
  australia: "AU",
  japan: "JP",
  japón: "JP",
};

/** Devuelve el ISO2 del país, o "PE" (mercado principal) si no se reconoce. */
export function toCountryCode(country?: string | null): string {
  if (!country) return "PE";
  const raw = country.trim().toLowerCase();
  // El mapa va primero: valores del selector como "UK" tienen dos letras pero
  // NO son ISO2 válidos (el código de Reino Unido es "GB").
  const mapped = COUNTRY_TO_ISO2[raw];
  if (mapped) return mapped;
  // Ya viene como ISO2 (ej. "PE")
  if (/^[a-z]{2}$/.test(raw)) return raw.toUpperCase();
  return "PE";
}

/**
 * Limpia un nombre/apellido para las pasarelas: sin dígitos ni símbolos,
 * espacios colapsados, 2–50 caracteres. Devuelve `null` si no queda nada
 * usable — es preferible omitir el campo que enviar un placeholder.
 */
export function sanitizeName(value?: string | null): string | null {
  if (!value) return null;
  const clean = value
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\s'.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
  return clean.length >= 2 ? clean : null;
}

/**
 * Teléfono en formato aceptado por las pasarelas: sólo dígitos, 7–15.
 * Devuelve `null` si el teléfono no es utilizable.
 */
export function sanitizePhone(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits.slice(-15);
}

/** Dirección para antifraude: recortada y sin caracteres de control. */
export function sanitizeAddress(value?: string | null): string | null {
  if (!value) return null;
  const clean = value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  return clean.length >= 3 ? clean : null;
}
