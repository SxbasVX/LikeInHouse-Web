import type { Prisma, PrismaClient } from "@prisma/client";
import type { CatalogTourCandidate } from "./schemas";
import { renderItineraryDay } from "./editorial";

export function normalize(value: string | null): string {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const stop = new Set(["tour", "tours", "full", "day", "dia", "dias", "the", "and", "del", "los", "las", "con", "para", "desde", "historia", "paisajes", "cultura"]);
function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(" ").filter((t) => t.length > 2 && !stop.has(t)));
}
function similarity(a: string, b: string): number {
  const left = tokens(a), right = tokens(b);
  if (!left.size || !right.size) return 0;
  return [...left].filter((t) => right.has(t)).length / Math.min(left.size, right.size);
}

export interface DuplicateMatch {
  tourId: string; score: number; reasons: string[]; matchingFields: string[];
  existing: { nameEs: string; nameEn: string; destination: string; durationDays: number; durationNights: number; durationHours: number | null; slug: string; itinerary: string; prices: Array<{ label: string; amount: string }> };
}

export async function findDuplicateMatches(db: PrismaClient | Prisma.TransactionClient, candidate: CatalogTourCandidate): Promise<DuplicateMatch[]> {
  const terms = [...tokens([candidate.nameEs, candidate.nameEn, ...(candidate.attractions ?? [])].filter(Boolean).join(" "))].slice(0, 8);
  const OR: Prisma.TourWhereInput[] = [
    ...(candidate.slug ? [{ slug: candidate.slug }] : []),
    ...(candidate.destination ? [{ destination: { contains: candidate.destination, mode: "insensitive" as const } }] : []),
    ...terms.flatMap((term) => [
      { nameEs: { contains: term, mode: "insensitive" as const } },
      { nameEn: { contains: term, mode: "insensitive" as const } },
    ]),
  ];
  if (!OR.length) return [];
  const tours = await db.tour.findMany({
    where: { OR }, take: 80, orderBy: { id: "asc" },
    select: { id: true, slug: true, nameEs: true, nameEn: true, destination: true,
      durationDays: true, durationNights: true, durationHours: true,
      itinerary: { select: { descriptionEs: true, descriptionEn: true }, orderBy: { dayNumber: "asc" } },
      pricing: { select: { tiers: { select: { labelEs: true, priceUsd: true } } } },
      conditions: { select: { textEs: true } },
    },
  });
  const itinerary = candidate.itinerary.map((day) => renderItineraryDay(day, "Es")).join(" ");
  const attractions = (candidate.attractions ?? []).map(normalize);
  return tours.map((tour) => {
    const reasons: string[] = [], matchingFields: string[] = [];
    let score = 0;
    const match = (field: string, weight: number, reason: string) => { score += weight; matchingFields.push(field); reasons.push(reason); };
    if (candidate.slug && candidate.slug === tour.slug) match("slug", 1, "El slug ya existe.");
    const nameScore = Math.max(similarity(candidate.nameEs ?? "", tour.nameEs), similarity(candidate.nameEn ?? "", tour.nameEn));
    if (nameScore >= 0.75) match("name", 0.5 * nameScore, "Los nombres comparten los atractivos principales.");
    if (candidate.destination && normalize(candidate.destination) === normalize(tour.destination)) match("destination", 0.12, "Coincide el destino.");
    if (candidate.durationDays !== null && candidate.durationDays === tour.durationDays && candidate.durationNights === tour.durationNights && candidate.durationHours === tour.durationHours) match("duration", 0.08, "Coincide la duración.");
    const existingItinerary = tour.itinerary.map((d) => d.descriptionEs).join(" ");
    const existingText = normalize(`${tour.nameEs} ${existingItinerary}`);
    if (attractions.length && attractions.filter((a) => existingText.includes(a)).length / attractions.length >= 0.6) match("attractions", 0.22, "Coinciden los atractivos documentados.");
    if (itinerary && existingItinerary && similarity(itinerary, existingItinerary) >= 0.65) match("itinerary", 0.22, "El recorrido tiene contenido muy similar.");
    const times = candidate.schedule?.times ?? [];
    if (times.length && times.every((time) => `${existingItinerary} ${tour.conditions.map((c) => c.textEs).join(" ")}`.includes(time))) match("schedule", 0.06, "Coinciden horarios.");
    if (candidate.prices.some((p) => p.amount !== null && p.currency === "USD" && tour.pricing?.tiers.some((t) => Math.abs(Number(t.priceUsd) - p.amount!) < 0.005))) match("price", 0.05, "Coincide una tarifa USD.");
    return { tourId: tour.id, score: Math.min(score, 1), reasons, matchingFields,
      existing: { nameEs: tour.nameEs, nameEn: tour.nameEn, destination: tour.destination, durationDays: tour.durationDays,
        durationNights: tour.durationNights, durationHours: tour.durationHours, slug: tour.slug,
        itinerary: existingItinerary, prices: (tour.pricing?.tiers ?? []).map((p) => ({ label: p.labelEs, amount: String(p.priceUsd) })) },
    };
  }).filter((match) => match.score >= 0.65).sort((a, b) => b.score - a.score);
}
