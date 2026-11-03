import { z } from "zod";
import { renderItineraryDay } from "@/server/catalog-import/editorial";

// The editable, text-only part of a tour. Prices, duration, destination, dates, images and slug are never part of it.
export const tourContentSchema = z.object({
  nameEs: z.string(), nameEn: z.string(),
  shortDescEs: z.string(), shortDescEn: z.string(),
  longDescEs: z.string(), longDescEn: z.string(),
  metaTitleEs: z.string().nullable(), metaTitleEn: z.string().nullable(),
  metaDescEs: z.string().nullable(), metaDescEn: z.string().nullable(),
  itinerary: z.array(z.object({ id: z.string(), dayNumber: z.number().int(), titleEs: z.string(), titleEn: z.string(), descriptionEs: z.string(), descriptionEn: z.string() })),
  includes: z.array(z.object({ id: z.string(), type: z.string(), textEs: z.string(), textEn: z.string() })),
  conditions: z.array(z.object({ id: z.string(), type: z.string(), textEs: z.string(), textEn: z.string() })),
});
export type TourContent = z.infer<typeof tourContentSchema>;

const text = z.string().trim().min(1);
const CONDITION_TYPES = ["HEALTH", "AGE", "BEHAVIOR", "GROUP_SIZE", "PHYSICAL", "GENERAL"] as const;

// What Claude returns. Itinerary activities are structured so the server renders the uniform "07:45 a. m. | Título" format.
export const tourProposalSchema = z.object({
  nameEs: text, nameEn: text,
  shortDescEs: text, shortDescEn: text,
  longDescEs: text, longDescEn: text,
  metaTitleEs: text, metaTitleEn: text, metaDescEs: text, metaDescEn: text,
  itinerary: z.array(z.object({
    dayNumber: z.number().int().positive(), titleEs: text, titleEn: text,
    items: z.array(z.object({
      time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?:\s*-\s*(?:[01]\d|2[0-3]):[0-5]\d)?$/).nullable(),
      labelEs: z.string().trim().min(1).nullable().optional(), labelEn: z.string().trim().min(1).nullable().optional(),
      titleEs: text, titleEn: text,
      descriptionEs: z.string().trim().nullable(), descriptionEn: z.string().trim().nullable(),
    })).min(1).max(30),
  })),
  // Existing items keep their id; items moved out of the long description come with id null and their type.
  includes: z.array(z.object({ id: z.string().nullable(), type: z.enum(["INCLUDE", "EXCLUDE"]).optional(), textEs: text, textEn: text })),
  conditions: z.array(z.object({ id: z.string(), type: z.enum(CONDITION_TYPES), textEs: text, textEn: text })),
  notes: z.array(z.object({ field: z.string(), reason: z.string() })).max(40).default([]),
});
export type TourProposal = z.infer<typeof tourProposalSchema>;

export const REVIEW_GROUPS = ["name", "shortDesc", "longDesc", "seo", "itinerary", "includes", "conditions"] as const;
export type ReviewGroup = (typeof REVIEW_GROUPS)[number];
export const GROUP_LABELS: Record<ReviewGroup, string> = {
  name: "Nombre", shortDesc: "Descripción corta", longDesc: "Descripción completa", seo: "SEO (Google)",
  itinerary: "Itinerario", includes: "Incluye / No incluye", conditions: "Condiciones",
};

export function groupValue(content: TourContent, group: ReviewGroup): unknown {
  switch (group) {
    case "name": return [content.nameEs, content.nameEn];
    case "shortDesc": return [content.shortDescEs, content.shortDescEn];
    case "longDesc": return [content.longDescEs, content.longDescEn];
    case "seo": return [content.metaTitleEs, content.metaTitleEn, content.metaDescEs, content.metaDescEn];
    // By day number, not id: a day created by a review has no database id until it is applied.
    case "itinerary": return content.itinerary.map((d) => [d.dayNumber, d.titleEs, d.titleEn, d.descriptionEs, d.descriptionEn]);
    // By content, not id: items created by a review get their database id only when applied.
    case "includes": return content.includes.map((i) => [i.type, i.textEs, i.textEn]);
    // By content too: saving the tour in the admin form recreates these rows with new ids.
    case "conditions": return content.conditions.map((c) => [c.type, c.textEs, c.textEn]);
  }
}
export const sameGroup = (a: TourContent, b: TourContent, group: ReviewGroup) => JSON.stringify(groupValue(a, group)) === JSON.stringify(groupValue(b, group));

/** Copies one group's values from `source` into `target` (used to apply and to undo). */
export function withGroup(target: TourContent, source: TourContent, group: ReviewGroup): TourContent {
  const next = { ...target };
  switch (group) {
    case "name": return { ...next, nameEs: source.nameEs, nameEn: source.nameEn };
    case "shortDesc": return { ...next, shortDescEs: source.shortDescEs, shortDescEn: source.shortDescEn };
    case "longDesc": return { ...next, longDescEs: source.longDescEs, longDescEn: source.longDescEn };
    case "seo": return { ...next, metaTitleEs: source.metaTitleEs, metaTitleEn: source.metaTitleEn, metaDescEs: source.metaDescEs, metaDescEn: source.metaDescEn };
    case "itinerary": return { ...next, itinerary: source.itinerary };
    case "includes": return { ...next, includes: source.includes };
    case "conditions": return { ...next, conditions: source.conditions };
  }
}

// Times written as "07:45", "7:45 a. m." or "02:00 p.m." all normalize to 24-hour "HH:mm".
export function extractTimes(value: string): string[] {
  const times = new Set<string>();
  for (const m of value.matchAll(/\b(\d{1,2}):([0-5]\d)\s*(a\.?\s?m\.?|p\.?\s?m\.?)?/gi)) {
    let hour = Number(m[1]);
    const suffix = m[3]?.toLowerCase().replace(/[\s.]/g, "");
    if (hour > 23) continue;
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
    times.add(`${String(hour).padStart(2, "0")}:${m[2]}`);
  }
  return [...times].sort();
}

const STOP_WORDS = new Set(["para", "desde", "hasta", "con", "los", "las", "del", "una", "uno", "por", "que", "the", "and", "with", "from"]);
const normalizeWords = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ");
// Most of the item's meaningful words already appear in the source text ("Transporte turístico." ← "...transporte turístico desde Lima...").
function mentionedIn(item: string, normalizedSource: string): boolean {
  const words = normalizeWords(item).split(" ").filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  if (!words.length) return false;
  const source = ` ${normalizedSource} `;
  return words.filter((w) => source.includes(` ${w}`)).length / words.length >= 0.6;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const tooLong = (value: string, max: number) => value.length > max;

const itineraryTimes = (content: TourContent) => extractTimes(content.itinerary.map((d) => `${d.titleEs} ${d.descriptionEs}`).join(" "));
// Itinerary and long description together: the set of times the tour documents in its text.
const documentedTimes = (content: TourContent) => [...new Set([...itineraryTimes(content), ...extractTimes(content.longDescEs)])].sort();

export interface ProposedContent {
  after: TourContent;
  rejected: Partial<Record<ReviewGroup, string>>;
  /** Groups that must be applied together (the itinerary was moved out of the long description). */
  linked: ReviewGroup[];
}

/**
 * Builds the proposed content. A group whose proposal breaks a rule keeps the current values and gets a reason:
 * the reviewer sees why it was not proposed instead of a silently "corrected" fact.
 * `maxDays` is the tour's duration in days (at least 1): the most days an itinerary may have.
 */
export function buildProposedContent(before: TourContent, proposal: TourProposal, maxDays = Math.max(1, before.itinerary.length)): ProposedContent {
  const rejected: Partial<Record<ReviewGroup, string>> = {};
  let after: TourContent = { ...before };

  after = { ...after, nameEs: proposal.nameEs, nameEn: proposal.nameEn };
  if (tooLong(proposal.nameEs, 120) || tooLong(proposal.nameEn, 120)) { rejected.name = "El nombre propuesto supera 120 caracteres."; after = withGroup(after, before, "name"); }

  after = { ...after, shortDescEs: proposal.shortDescEs, shortDescEn: proposal.shortDescEn };
  if (tooLong(proposal.shortDescEs, 160) || tooLong(proposal.shortDescEn, 160)) { rejected.shortDesc = "La descripción corta propuesta supera 160 caracteres."; after = withGroup(after, before, "shortDesc"); }

  after = { ...after, metaTitleEs: proposal.metaTitleEs, metaTitleEn: proposal.metaTitleEn, metaDescEs: proposal.metaDescEs, metaDescEn: proposal.metaDescEn };
  if (tooLong(proposal.metaTitleEs, 70) || tooLong(proposal.metaTitleEn, 70) || tooLong(proposal.metaDescEs, 170) || tooLong(proposal.metaDescEn, 170)) {
    rejected.seo = "El SEO propuesto supera 70 caracteres de título o 170 de descripción."; after = withGroup(after, before, "seo");
  }

  // Itinerary: keeps every existing day; may add days (e.g. an itinerary written inside the description) up to the tour's duration.
  const proposedDays = new Map(proposal.itinerary.map((d) => [d.dayNumber, d]));
  const dayLimit = Math.max(maxDays, before.itinerary.length, 1);
  const dayProblem = before.itinerary.some((d) => !proposedDays.has(d.dayNumber)) ? "El itinerario propuesto quita días existentes."
    : proposal.itinerary.some((d) => d.dayNumber > dayLimit) ? `El itinerario propuesto supera los ${dayLimit} días del tour.`
    : null;
  const existing = new Map(before.itinerary.map((d) => [d.dayNumber, d]));
  const proposedItinerary = [...proposedDays.values()].sort((a, b) => a.dayNumber - b.dayNumber).map((day) => {
    const items = day.items.map((item) => ({ ...item, labelEs: item.labelEs ?? null, labelEn: item.labelEn ?? null }));
    const rendered = { dayNumber: day.dayNumber, titleEs: day.titleEs, titleEn: day.titleEn, descriptionEs: null, descriptionEn: null, items };
    return { id: existing.get(day.dayNumber)?.id ?? `new-day-${day.dayNumber}`, dayNumber: day.dayNumber, titleEs: day.titleEs, titleEn: day.titleEn,
      descriptionEs: renderItineraryDay(rendered, "Es"), descriptionEn: renderItineraryDay(rendered, "En") };
  });

  // Times may move between the description and the itinerary, but none may be invented or lost.
  const withBoth = { ...after, itinerary: proposedItinerary, longDescEs: proposal.longDescEs, longDescEn: proposal.longDescEn };
  const withDescOnly = { ...after, longDescEs: proposal.longDescEs, longDescEn: proposal.longDescEn };
  const had = documentedTimes(before);
  // New days mean the itinerary was taken from the description (with or without times): both go live together or not at all.
  const fromDescription = proposedItinerary.length > before.itinerary.length;
  if (dayProblem) {
    rejected.itinerary = dayProblem;
    if (fromDescription) rejected.longDesc = "La descripción traslada su itinerario, pero el itinerario propuesto no se pudo validar.";
    else if (sameSet(had, documentedTimes(withDescOnly))) after = withDescOnly;
    else rejected.longDesc = "La descripción propuesta quita horarios que no pasan al itinerario.";
  } else if (sameSet(had, documentedTimes(withBoth))) {
    after = withBoth;
  } else {
    const reason = `Las horas no coinciden con las actuales (${had.join(", ") || "sin horas"} → ${documentedTimes(withBoth).join(", ") || "sin horas"}).`;
    rejected.itinerary = reason;
    if (!fromDescription && sameSet(had, documentedTimes(withDescOnly))) after = withDescOnly;
    else rejected.longDesc = reason;
  }
  // Times or days that leave the description only survive if the itinerary goes live with it.
  const moved = fromDescription || extractTimes(before.longDescEs).some((t) => !extractTimes(after.longDescEs).includes(t));
  const linked: ReviewGroup[] = moved && !rejected.itinerary && !rejected.longDesc ? ["longDesc", "itinerary"] : [];

  // Includes: every existing item stays (reworded). New items are only accepted when they were written in the
  // current long description (a list moved out of it), never as services Claude came up with.
  const known = new Map(before.includes.map((i) => [i.id, i]));
  const reworded = proposal.includes.filter((i) => i.id !== null && known.has(i.id));
  const added = proposal.includes.filter((i) => i.id === null);
  const sourceText = normalizeWords(`${before.longDescEs} ${before.longDescEn}`);
  const invented = added.filter((i) => !mentionedIn(i.textEs, sourceText));
  const includesProblem = reworded.length !== before.includes.length || new Set(reworded.map((i) => i.id)).size !== before.includes.length
    || proposal.includes.some((i) => i.id !== null && !known.has(i.id))
    ? "La propuesta quita o cambia elementos existentes de Incluye / No incluye."
    : added.some((i) => !i.type) ? "Un elemento nuevo no indica si es Incluye o No incluye."
    : invented.length ? `Agrega servicios que no figuran en la descripción actual: ${invented.map((i) => `«${i.textEs}»`).join(", ")}.`
    : null;
  if (includesProblem) {
    rejected.includes = includesProblem;
    // A description that handed its list to a rejected Incluye would lose it: keep the current description too.
    if (added.length && !rejected.longDesc && !sameGroup(before, after, "longDesc")) {
      rejected.longDesc = "La descripción traslada servicios a Incluye / No incluye, pero ese bloque no se pudo validar.";
      after = withGroup(after, before, "longDesc");
      linked.length = 0;
    }
  } else {
    const rewordedById = new Map(reworded.map((i) => [i.id!, i]));
    after = { ...after, includes: [
      ...before.includes.map((i) => ({ ...i, textEs: rewordedById.get(i.id)!.textEs, textEn: rewordedById.get(i.id)!.textEn })),
      ...added.map((i, index) => ({ id: `new-include-${index + 1}`, type: i.type!, textEs: i.textEs, textEn: i.textEn })),
    // Same order the database returns (by type, then position), so apply/undo comparisons line up.
    ].sort((a, b) => (a.type < b.type ? -1 : a.type > b.type ? 1 : 0)) };
    if (added.length && !rejected.longDesc) for (const group of ["longDesc", "includes"] as const) if (!linked.includes(group)) linked.push(group);
  }

  const conditions = new Map(proposal.conditions.map((c) => [c.id, c]));
  if (proposal.conditions.length !== before.conditions.length || conditions.size !== before.conditions.length || before.conditions.some((c) => !conditions.has(c.id))) rejected.conditions = "La propuesta agrega o quita condiciones.";
  else after = { ...after, conditions: before.conditions.map((c) => ({ ...c, type: conditions.get(c.id)!.type, textEs: conditions.get(c.id)!.textEs, textEn: conditions.get(c.id)!.textEn })) };

  return { after, rejected, linked };
}

/** True when applying `groups` from `after` keeps every time the tour documents (description + itinerary). */
export function keepsTimes(before: TourContent, after: TourContent, groups: ReviewGroup[]): boolean {
  let target = before;
  for (const group of groups) target = withGroup(target, after, group);
  return sameSet(documentedTimes(before), documentedTimes(target));
}

export const changedGroups = (before: TourContent, after: TourContent) => REVIEW_GROUPS.filter((group) => !sameGroup(before, after, group));
