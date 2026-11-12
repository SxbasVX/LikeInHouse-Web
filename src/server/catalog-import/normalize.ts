// Deterministic fixes applied before validation, so the reviewer is only asked what a person must decide.
// Pure and idempotent: running it again on its own output changes nothing.
import { joinCategories, mapLegacyCategory, MAX_CATEGORIES_PER_TOUR, splitCategories } from "@/lib/tour-categories";
import type { CatalogTourCandidate } from "./schemas";

/** Bump when the automatic rules change: stored candidates on an older version are revalidated when the inbox loads. */
export const RULES_VERSION = 1;

/** Official lists a tour must use; a value outside them can't be created. */
export interface OfficialLists { destinations: string[]; categories: string[] }

type Price = CatalogTourCandidate["prices"][number];
type AutoFix = NonNullable<CatalogTourCandidate["autoFixes"]>[number];

// More rates than this (or several service options) can't be sold online: the tour is published as "Adquiérelo desde".
const MAX_BOOKABLE_RATES = 6;
const MAX_LISTED_RATES = 12;
const SHORT_DESC_MAX = 160;
// Only used to compare rates in different currencies when the SUNAT rate is not stored yet.
const APPROX_PEN_PER_USD = 3.75;

const strip = (value: string | null | undefined) => (value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const containsWords = (text: string, words: string) => Boolean(words) && ` ${text} `.includes(` ${words} `);
// "Tour con salida desde Tumbes" adds nothing to a label that already says "salida desde Tumbes".
function alreadySays(label: string, extra: string): boolean {
  const words = strip(extra).split(" ").filter((w) => w.length > 2), have = new Set(strip(label).split(" "));
  return !words.length || words.filter((w) => have.has(w)).length / words.length >= 0.6;
}

// Keywords for the default official categories; a category the agency renamed or removed is simply never proposed.
const CATEGORY_KEYWORDS: Array<[string, RegExp]> = [
  ["Naturaleza", /natural|ecotur|fauna|flora|marin|ballena|tortuga|playa|manglar|salar|lagun|\blago\b|\bisla|selva|cascada|catarata|paisaj|silvestre|reserva|parque nacional|avistamiento|volcan|nevado|desierto|oasis/],
  ["Aventura", /aventura|trek|caminata|rafting|canotaje|buceo|snorkel|sandboard|buggy|tubular|cuatrimoto|zipline|canopy|escalada|ciclismo|bicicleta|kayak|4x4|expedicion|parapente/],
  ["Cultura", /cultur|arqueolog|histor|city tour|museo|colonial|\binca|comunidad|vivencial|tradicion|ruinas|templo|iglesia|catedral|patrimonio|cholet|teleferico|folklor|artesan/],
  ["Gastronomía", /gastronom|culinari|\bcena\b|pisco|\bvino|bodega|cocina|ceviche|\bcata\b|degustacion/],
];

function categoriesByKeyword(text: string, official: string[]): string[] {
  const plain = strip(text);
  return CATEGORY_KEYWORDS.filter(([name, pattern]) => official.includes(name) && pattern.test(plain)).map(([name]) => name);
}

// Rates only some travellers can buy must never become the public "desde" price.
const isRestrictedRate = (price: Price) => /\b(residente|residentes|resident|residents|estudiante|estudiantes|student|students|nacional|nacionales|peruano|peruanos)\b/.test(strip(`${price.labelEs ?? ""} ${price.labelEn ?? ""}`));
const isConvertible = (price: Price) => price.currency === "USD" || price.currency === "PEN";

function isChildRate(price: Price): boolean {
  if (price.ageMax != null && price.ageMax <= 17) return true;
  return /\b(nino|ninos|nina|child|children|chd|infante|infant|bebe|baby|menor|menores|kids?)\b/.test(strip(`${price.labelEs ?? ""} ${price.labelEn ?? ""}`));
}

const optionKey = (price: Price) => `${strip(price.serviceMode)}|${price.minPassengers ?? ""}|${price.maxPassengers ?? ""}`;
const hasOption = (price: Price) => Boolean(price.serviceMode) || price.minPassengers != null || price.maxPassengers != null;

function passengerLabel(price: Price, locale: "Es" | "En"): string | null {
  const { minPassengers: min, maxPassengers: max } = price;
  if (min == null && max == null) return null;
  if (locale === "Es") return min != null && max != null ? `${min} a ${max} personas` : min != null ? `desde ${min} personas` : `hasta ${max} personas`;
  return min != null && max != null ? `${min} to ${max} people` : min != null ? `from ${min} people` : `up to ${max} people`;
}

// The sales model has no "service mode" or "passenger range" columns: that information lives in the rate label.
function foldOptionIntoLabel(price: Price): Price {
  if (!hasOption(price)) return price;
  const next = { ...price };
  for (const locale of ["Es", "En"] as const) {
    const key = `label${locale}` as const;
    const label = next[key];
    if (!label) continue;
    const parts = [label];
    const mode = price.serviceMode?.trim();
    if (mode && mode.length <= 40 && !alreadySays(label, mode)) parts.push(mode);
    const passengers = passengerLabel(price, locale);
    if (passengers && !/\b(persona|personas|pasajero|pasajeros|pax|people|person|passengers?)\b/.test(strip(label))) parts.push(passengers);
    next[key] = parts.join(" · ");
  }
  if (price.serviceMode && !strip(next.notes).includes(strip(price.serviceMode))) next.notes = [next.notes, `Modalidad: ${price.serviceMode.trim()}`].filter(Boolean).join(" · ");
  next.serviceMode = null; next.minPassengers = null; next.maxPassengers = null;
  return next;
}

const comparable = (price: Price, penPerUsd: number) => price.amount == null ? Infinity : price.currency === "PEN" ? price.amount / penPerUsd : price.amount;
const rateText = (price: Price, locale: "Es" | "En") => `${price[`label${locale}`] ?? price.labelEs ?? price.labelEn ?? "Tarifa"}: ${price.amount ?? "—"} ${price.currency ?? ""}`.trim();

function trimShortDescription(value: string): string {
  if (value.length <= SHORT_DESC_MAX) return value;
  const cut = value.slice(0, SHORT_DESC_MAX - 1);
  const sentence = cut.lastIndexOf(". ");
  if (sentence > SHORT_DESC_MAX * 0.6) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).replace(/[\s,;:.]+$/, "")}…`;
}

function durationFromName(name: string): { days: number; nights: number } | null {
  const compact = /(\d{1,2})\s*d\s*\/\s*(\d{1,2})\s*n\b/i.exec(name) ?? /(\d{1,2})\s*d[ií]as?\s*(?:y|\/|,|con)?\s*(\d{1,2})\s*noches?/i.exec(name) ?? /(\d{1,2})\s*days?\s*(?:and|\/|,)?\s*(\d{1,2})\s*nights?/i.exec(name);
  return compact ? { days: Number(compact[1]), nights: Number(compact[2]) } : null;
}

export function slugify(value: string): string {
  return strip(value).replace(/ /g, "-").slice(0, 80).replace(/-+$/, "");
}

/** Returns a normalized copy. `lists` enables the destination and category fixes. */
export function normalizeCandidate(original: CatalogTourCandidate, lists?: OfficialLists): CatalogTourCandidate {
  const c: CatalogTourCandidate = { ...original, provenance: { ...original.provenance }, prices: original.prices.map((p) => ({ ...p })) };
  const fixes: AutoFix[] = [...(original.autoFixes ?? [])];
  const note = (field: string, reason: string, verify = false) => {
    // One note per field: a newer fix on the same field replaces the older explanation.
    const index = fixes.findIndex((f) => f.field === field);
    if (index >= 0) fixes.splice(index, 1);
    fixes.push({ field, reason, verify });
  };
  const derived = (field: string, evidence: string) => { c.provenance![field] = { source: "derived", requiresReview: false, sourcePages: c.sourcePages, evidence }; };
  const names = `${c.nameEs ?? ""} ${c.nameEn ?? ""}`;

  if (!c.slug && (c.nameEs || c.nameEn)) c.slug = slugify(c.nameEs ?? c.nameEn!) || null;

  // --- Destination: must be one of the agency's cities.
  if (lists && c.destination && !lists.destinations.includes(c.destination)) {
    const wanted = strip(c.destination);
    const byLength = [...lists.destinations].sort((a, b) => b.length - a.length);
    const exact = lists.destinations.find((d) => strip(d) === wanted);
    const inside = byLength.find((d) => containsWords(wanted, strip(d)));
    const inName = byLength.find((d) => containsWords(strip(names), strip(d)));
    if (exact) c.destination = exact;
    else if (inside) {
      // "Cusco y Puno" names two of the agency's cities: which one is the base is the reviewer's call.
      const several = lists.destinations.filter((d) => containsWords(wanted, strip(d)) && !containsWords(strip(inside), strip(d))).length > 0;
      note("destination", `Destino ajustado a la lista de ciudades: «${inside}» (el PDF indica «${c.destination}»).`, several);
      c.destination = inside;
    }
    else if (inName) { note("destination", `Se asignó la ciudad «${inName}» por el nombre del tour (el PDF indica «${c.destination}»).`, true); c.destination = inName; }
  }

  // --- Category: 1 to 3 from the official list.
  if (lists) {
    const current = splitCategories(c.category);
    if (!current.length || current.some((cat) => !lists.categories.includes(cat))) {
      const mapped = c.category ? mapLegacyCategory(c.category, lists.categories).categories : [];
      const found = mapped.length ? mapped
        : (c.category && categoriesByKeyword(c.category, lists.categories).length) ? categoriesByKeyword(c.category, lists.categories)
        : categoriesByKeyword(`${names} ${c.shortDescEs ?? ""} ${(c.attractions ?? []).join(" ")}`, lists.categories).slice(0, 2);
      if (found.length) {
        const next = joinCategories(found.slice(0, MAX_CATEGORIES_PER_TOUR), lists.categories);
        note("category", c.category ? `Categoría ajustada a la lista oficial: «${next}» (propuesta original: «${c.category}»).` : `Categoría sugerida según el contenido del tour: «${next}».`);
        c.category = next;
        c.provenance!.category = { source: "inferred", requiresReview: false, sourcePages: c.sourcePages, evidence: "Asignada automáticamente desde la lista oficial de categorías." };
      }
    }
  }

  // --- Difficulty: catalogs almost never state it; a missing value would block the tour for no reason.
  if (!c.difficulty) {
    c.difficulty = /trek|ascenso|cumbre|alta montana|camino inca|caminata de \d+ ?(h|hora)/.test(strip(`${names} ${c.shortDescEs ?? ""}`)) ? "MODERATE" : "EASY";
    note("difficulty", `Dificultad sugerida: ${c.difficulty === "EASY" ? "fácil" : "moderada"} (el PDF no la indica).`);
    c.provenance!.difficulty = { source: "inferred", requiresReview: false, sourcePages: c.sourcePages, evidence: "El PDF no indica dificultad; se sugirió según el tipo de actividad." };
  }

  // --- Duration: full days, hour tours and "5D/4N" names leave no doubt.
  const named = durationFromName(names);
  if (c.durationDays == null) {
    const days = Math.max(0, ...c.itinerary.map((d) => d.dayNumber));
    if (named) { c.durationDays = named.days; c.durationNights ??= named.nights; note("durationDays", `Duración tomada del nombre del tour: ${named.days}D/${named.nights}N.`); }
    else if (/full ?day|dia completo|todo el dia/.test(strip(names))) { c.durationDays = 1; c.durationNights ??= 0; note("durationDays", "Duración: 1 día (el tour es full day)."); }
    else if (c.durationHours) { c.durationDays = 0; c.durationNights ??= 0; note("durationDays", `Duración: experiencia de ${c.durationHours} horas.`); }
    else if (days === 1) { c.durationDays = 1; c.durationNights ??= 0; note("durationDays", "Duración: 1 día (el itinerario tiene un solo día)."); }
    else if (days > 1) { c.durationDays = days; note("durationDays", `Se asumieron ${days} días por el itinerario; el PDF no indica la duración.`, true); }
    if (c.durationDays != null) derived("durationDays", "Derivado del nombre o del itinerario del tour.");
  }
  if (c.durationNights == null && c.durationDays != null) {
    if (named && named.days === c.durationDays) c.durationNights = named.nights;
    else if (c.durationDays <= 1) c.durationNights = 0;
    else { c.durationNights = c.durationDays - 1; note("durationNights", `Se asumieron ${c.durationNights} noches (días − 1); el PDF no las indica.`, true); }
    derived("durationNights", "Derivado de la duración en días.");
  }

  // A doubt the model raised is settled when the value can be checked without the PDF.
  const settle = (field: string, evidence: string) => {
    const proof = c.provenance![field];
    if (proof && (proof.requiresReview || proof.source === "inferred" || proof.source === "suggested")) c.provenance![field] = { ...proof, source: "derived", requiresReview: false, evidence: proof.evidence ?? evidence };
  };
  if (c.durationDays != null && c.durationDays <= 1 && c.durationNights === 0) settle("durationNights", "Un tour de un día o menos no tiene noches.");
  if (named && named.days === c.durationDays && named.nights === c.durationNights) { settle("durationDays", "Coincide con el nombre del tour."); settle("durationNights", "Coincide con el nombre del tour."); }
  c.prices.forEach((price, index) => {
    const calc = price.calculation;
    // The arithmetic of a derived rate (base − discount) is verified by the validator, not by a person.
    if (price.source === "derived" && calc && price.amount != null && c.prices.some((other) => other !== price && other.amount === calc.baseAmount)) settle(`prices.${index}.amount`, calc.expression);
  });

  // --- Prices.
  if (c.prices.some((p) => p.priceType == null || p.priceType === "unknown")) {
    c.prices = c.prices.map((p) => (p.priceType == null || p.priceType === "unknown" ? { ...p, priceType: "per_person" as const } : p));
    note("prices.unit", "El PDF no indica si la tarifa es por persona o por grupo; se asumió por persona.", true);
  }
  // Rates the reviewer edited by hand are theirs: they are never collapsed again.
  const reviewerPrices = c.provenance!.prices?.source === "manual";
  const perPerson = c.prices.filter((p) => p.priceType === "per_person");
  const options = new Set(perPerson.filter(hasOption).map(optionKey));
  if (!reviewerPrices && perPerson.length && (options.size > 1 || c.prices.length > MAX_BOOKABLE_RATES)) {
    const penPerUsd = c.priceAdjustment?.penPerUsd ?? APPROX_PEN_PER_USD;
    // "Desde" is a documented adult rate anyone can buy, in a currency the site converts.
    const adults = perPerson.filter((p) => !isChildRate(p) && !isRestrictedRate(p) && isConvertible(p) && p.source !== "derived" && p.amount != null && p.amount > 0);
    const cheapest = adults.sort((a, b) => comparable(a, penPerUsd) - comparable(b, penPerUsd))[0];
    if (cheapest) {
      // Child rates of the same option stay with it (a derived one only if its base is the kept rate);
      // with a single (or no) option they can't be told apart, so only the adult rate is kept.
      const sibling = (p: Price) => p.priceType === "per_person" && isChildRate(p) && hasOption(p) && optionKey(p) === optionKey(cheapest)
        && (p.source !== "derived" || p.calculation?.baseAmount === cheapest.amount);
      const kept = options.size > 1 ? c.prices.filter((p) => p === cheapest || sibling(p)) : [cheapest];
      const dropped = c.prices.filter((p) => !kept.includes(p));
      const listed = (locale: "Es" | "En") => dropped.slice(0, MAX_LISTED_RATES).map((p) => rateText(p, locale)).join("; ");
      const more = dropped.length - MAX_LISTED_RATES;
      const conditions = [...(c.conditions ?? [])];
      if (dropped.length && !conditions.some((x) => strip(x.titleEs) === "otras tarifas")) conditions.push({
        type: "GENERAL", titleEs: "Otras tarifas", titleEn: "Other rates",
        descriptionEs: `${listed("Es")}${more > 0 ? `; y ${more} tarifas más` : ""}. Se cotizan a pedido.`,
        descriptionEn: `${listed("En")}${more > 0 ? `; and ${more} more rates` : ""}. Quoted on request.`,
      });
      c.conditions = conditions;
      note("prices", `El PDF tiene ${c.prices.length} tarifas: el tour se publica como informativo («Adquiérelo desde») con la más económica, ${rateText(cheapest, "Es")}. Las demás quedaron en la condición «Otras tarifas».`, true);
      c.prices = kept;
      c.informational = true;
      // Per-rate evidence was keyed by the old positions: it no longer points at the rates that remain.
      for (const key of Object.keys(c.provenance!)) if (/^prices\.\d+/.test(key)) delete c.provenance![key];
      c.provenance!.prices = { source: "document", requiresReview: false, sourcePages: c.sourcePages, evidence: `Tarifa más económica del PDF: ${rateText(cheapest, "Es")}.` };
    }
  }
  const folded = c.prices.filter((p) => p.priceType === "per_person" && hasOption(p));
  if (folded.length) {
    // A minimum or a range of passengers changes who can buy the rate: on a bookable tour the reviewer confirms it.
    const limited = folded.some((p) => (p.minPassengers ?? 1) > 1 || p.maxPassengers != null);
    if (!fixes.some((f) => f.field === "prices")) {
      note("prices.conditions", limited
        ? "La tarifa aplica con un mínimo o rango de pasajeros; quedó escrito en la etiqueta porque la reserva en línea no lo controla."
        : "La modalidad del servicio quedó escrita en la etiqueta de la tarifa.", limited && !c.informational);
    }
    c.prices = c.prices.map((p) => (p.priceType === "per_person" ? foldOptionIntoLabel(p) : p));
  }

  // --- Texts.
  for (const field of ["shortDescEs", "shortDescEn"] as const) if (c[field] && c[field]!.length > SHORT_DESC_MAX) c[field] = trimShortDescription(c[field]!);
  c.metaTitleEs ??= c.nameEs?.slice(0, 70) ?? null; c.metaTitleEn ??= c.nameEn?.slice(0, 70) ?? null;
  c.metaDescEs ??= c.shortDescEs; c.metaDescEn ??= c.shortDescEn;
  if (c.imageSuggestions?.length && !c.imageSuggestions.some((s) => s.recommendedForCover)) {
    c.imageSuggestions = c.imageSuggestions.map((s, i) => (i === 0 ? { ...s, recommendedForCover: true } : s));
  }

  c.autoFixes = fixes.length ? fixes : undefined;
  c.rulesVersion = RULES_VERSION;
  return c;
}
