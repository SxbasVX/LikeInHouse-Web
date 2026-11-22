// Texto corto de edades de un tour (tarjeta y ficha). Sin datos válidos devuelve null.

export interface TourAgesInput {
  /** Si viene en false, el tour dejó de ser familiar y no se muestran edades. */
  isFamily?: boolean | null;
  minAge?: number | null;
  recommendedAgeMin?: number | null;
  recommendedAgeMax?: number | null;
}

export interface FormatTourAgesOptions {
  /** Agrega la edad mínima cuando también hay rango recomendado (ficha del tour). */
  withMinimum?: boolean;
}

// Edad válida: entero >= 0 y razonable
function age(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 120) return null;
  return Math.floor(value);
}

export function formatTourAges(
  tour: TourAgesInput,
  locale: string,
  options: FormatTourAgesOptions = {}
): string | null {
  if (tour.isFamily === false) return null;
  const isEs = locale !== "en";
  // Edad mínima 0 equivale a "sin restricción"
  const min = age(tour.minAge) || null;
  let from = age(tour.recommendedAgeMin);
  let to = age(tour.recommendedAgeMax);
  if (from != null && to != null && from > to) [from, to] = [to, from];

  let recommended: string | null = null;
  if (from != null && to != null) {
    if (from === to) {
      recommended = isEs ? `Recomendado para ${from} años` : `Recommended for age ${from}`;
    } else {
      // "niños" sólo si el rango no llega a la adolescencia
      recommended = isEs
        ? to <= 12 ? `Recomendado para niños de ${from} a ${to} años` : `Recomendado de ${from} a ${to} años`
        : `Recommended for ages ${from}–${to}`;
    }
  } else if (from != null && from > 0) {
    recommended = isEs ? `Recomendado desde los ${from} años` : `Recommended for ages ${from} and up`;
  } else if (to != null) {
    recommended = isEs ? `Recomendado hasta los ${to} años` : `Recommended for ages up to ${to}`;
  }

  const minimum = min != null ? (isEs ? `Disponible desde los ${min} años` : `Available for ages ${min} and up`) : null;

  if (!recommended) return minimum;
  if (options.withMinimum && minimum && (from == null || min! < from)) {
    return isEs ? `${recommended} (disponible desde los ${min} años)` : `${recommended} (available for ages ${min} and up)`;
  }
  return recommended;
}
