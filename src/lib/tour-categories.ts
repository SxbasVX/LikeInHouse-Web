// Categorías de tours. Un tour puede tener varias; se guardan en `Tour.category`
// como texto separado por ", " (ej. "Cultura, Naturaleza") para no cambiar el schema.

export const DEFAULT_TOUR_CATEGORIES = ["Aventura", "Cultura", "Naturaleza", "Gastronomía"];
export const MAX_CATEGORIES_PER_TOUR = 3;
export const CATEGORY_SEPARATOR = ", ";

export function splitCategories(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((c) => c.trim()).filter(Boolean);
}

/** Une las categorías respetando el orden de la lista oficial. */
export function joinCategories(selected: string[], official: string[]): string {
  const order = (c: string) => {
    const i = official.indexOf(c);
    return i === -1 ? official.length : i;
  };
  return [...new Set(selected)].sort((a, b) => order(a) - order(b)).join(CATEGORY_SEPARATOR);
}

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Sinónimos usados antes de que existiera la lista oficial
const LEGACY_ALIASES: Record<string, string[]> = {
  cultural: ["Cultura"],
  "city tour": ["Cultura"],
  sabor: ["Gastronomía"],
  sabores: ["Gastronomía"],
  gastronomica: ["Gastronomía"],
  culinaria: ["Gastronomía"],
  "tour gastronomico": ["Gastronomía"],
  "cena show": ["Gastronomía", "Cultura"],
};

/**
 * Traduce una categoría escrita a mano ("Naturaleza, cultura y sabor") a la
 * lista oficial (["Cultura", "Naturaleza", "Gastronomía"]). Lo que no reconoce
 * queda en `unknown` para revisarlo.
 */
export function mapLegacyCategory(value: string, official: string[]): { categories: string[]; unknown: string[] } {
  const byKey = new Map(official.map((c) => [strip(c), c]));
  const found: string[] = [];
  const unknown: string[] = [];
  for (const token of value.split(/,|\s+y\s+|\s*&\s*|\//i).map((t) => t.trim()).filter(Boolean)) {
    const key = strip(token);
    const direct = byKey.get(key);
    const matches = (direct ? [direct] : LEGACY_ALIASES[key] ?? []).filter((m) => official.includes(m));
    if (matches.length > 0) found.push(...matches);
    else unknown.push(token);
  }
  return { categories: splitCategories(joinCategories(found, official)), unknown };
}
