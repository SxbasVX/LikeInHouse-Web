/**
 * Resolución de los listings de Airbnb desde Settings.
 *
 * Acepta dos formas guardadas en DB para retrocompatibilidad:
 *  1) `airbnbListings`: JSON array `[{label, url}, ...]` (preferido)
 *  2) `airbnbUrl`: string con una sola URL (legacy)
 *
 * Si ambos existen, `airbnbListings` gana.
 */

export interface AirbnbListing {
  label: string;
  url: string;
}

function isValidUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  if (url.length < 8 || url.length > 500) return false;
  return /^https?:\/\//i.test(url);
}

function coerceListing(raw: unknown): AirbnbListing | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const url = obj.url;
  if (!isValidUrl(url)) return null;
  const label = typeof obj.label === "string" && obj.label.trim().length > 0
    ? obj.label.trim().slice(0, 80)
    : "Airbnb";
  return { label, url };
}

/**
 * Devuelve la lista de listings desde el mapa de settings (key->value).
 * Siempre retorna un array (vacío si no hay nada configurado).
 */
export function parseAirbnbListings(
  settings: Record<string, unknown> | null | undefined
): AirbnbListing[] {
  if (!settings) return [];

  // 1) Modo nuevo: array
  const listingsRaw = settings.airbnbListings;
  if (Array.isArray(listingsRaw)) {
    const parsed = listingsRaw.map(coerceListing).filter((x): x is AirbnbListing => x !== null);
    if (parsed.length > 0) return parsed;
  }

  // 1.b) También aceptamos JSON string en `airbnbListings` (por si admin lo guarda así)
  if (typeof listingsRaw === "string" && listingsRaw.trim().length > 0) {
    try {
      const arr = JSON.parse(listingsRaw);
      if (Array.isArray(arr)) {
        const parsed = arr.map(coerceListing).filter((x): x is AirbnbListing => x !== null);
        if (parsed.length > 0) return parsed;
      }
    } catch {
      // ignore parse error, falls through to legacy
    }
  }

  // 2) Modo legacy: una sola URL en `airbnbUrl`
  const legacy = settings.airbnbUrl;
  if (isValidUrl(legacy)) {
    return [{ label: "Airbnb", url: legacy }];
  }

  return [];
}
