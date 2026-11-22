// "¿Quiénes viajan?" de la web familiar. Cada grupo es un hilo con su color, y la
// selección viaja en la URL del catálogo: /tours?viajan=ninos,abuelos

export const TRAVELER_GROUPS = [
  { key: "bebes", minAge: 0, thread: "#F2B33D" },
  { key: "ninos", minAge: 3, thread: "#F2B33D" },
  { key: "adolescentes", minAge: 12, thread: "#FC451F" },
  { key: "abuelos", minAge: null, thread: "#7A2A24" },
] as const;

export type TravelerGroup = (typeof TRAVELER_GROUPS)[number]["key"];

export const TRAVELERS_PARAM = "viajan";

const KEYS = new Set<string>(TRAVELER_GROUPS.map((g) => g.key));

/** Lee `viajan=ninos,abuelos` y descarta valores desconocidos o repetidos. */
export function parseTravelers(value: string | null | undefined): TravelerGroup[] {
  if (!value) return [];
  const picked = new Set(value.split(",").map((v) => v.trim().toLowerCase()).filter((v) => KEYS.has(v)));
  // Siempre en el orden de TRAVELER_GROUPS, para que la URL sea estable.
  return TRAVELER_GROUPS.map((g) => g.key).filter((k) => picked.has(k));
}

/** Filtro del catálogo: la edad del menor que viaja y si viajan adultos mayores. */
export function travelersToFilter(groups: TravelerGroup[]): { youngestAge?: number; seniors?: boolean } {
  const ages = TRAVELER_GROUPS.filter((g) => groups.includes(g.key) && g.minAge !== null).map((g) => g.minAge as number);
  return {
    ...(ages.length ? { youngestAge: Math.min(...ages) } : {}),
    ...(groups.includes("abuelos") ? { seniors: true } : {}),
  };
}

/** Ruta del catálogo con la selección; sin selección, el catálogo completo. */
export function travelersHref(groups: TravelerGroup[]): string {
  const clean = parseTravelers(groups.join(","));
  return clean.length ? `/tours?${TRAVELERS_PARAM}=${clean.join(",")}` : "/tours";
}
