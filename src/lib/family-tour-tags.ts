// Etiquetas familiares de un tour, sólo a partir de datos reales cargados en el panel:
// la dificultad (ritmo) y las edades. Si el dato no está, la etiqueta no aparece.

export interface FamilyTagInput {
  isFamily?: boolean | null;
  difficulty?: "EASY" | "MODERATE" | "CHALLENGING" | string | null;
  minAge?: number | null;
  recommendedAgeMax?: number | null;
}

export type FamilyTagTone = "pace" | "kids" | "all";

export interface FamilyTag {
  label: string;
  tone: FamilyTagTone;
}

const PACE: Record<string, { es: string; en: string }> = {
  EASY: { es: "Ritmo tranquilo", en: "Relaxed pace" },
  MODERATE: { es: "Ritmo moderado", en: "Moderate pace" },
  CHALLENGING: { es: "Ritmo exigente", en: "Active pace" },
};

export function familyTourTags(tour: FamilyTagInput, locale: string): FamilyTag[] {
  if (!tour.isFamily) return [];
  const isEs = locale !== "en";
  const tags: FamilyTag[] = [];

  // "Para toda la familia": se puede ir desde bebés (edad mínima 0 cargada a propósito).
  if (tour.minAge === 0) tags.push({ label: isEs ? "Para toda la familia" : "For the whole family", tone: "all" });
  // "Ideal para niños": el rango recomendado termina en la niñez.
  else if (typeof tour.recommendedAgeMax === "number" && tour.recommendedAgeMax <= 12) {
    tags.push({ label: isEs ? "Ideal para niños" : "Great for kids", tone: "kids" });
  }

  const pace = tour.difficulty ? PACE[tour.difficulty] : undefined;
  if (pace) tags.push({ label: isEs ? pace.es : pace.en, tone: "pace" });

  return tags;
}
