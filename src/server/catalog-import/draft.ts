import type { Prisma } from "@prisma/client";
import type { CatalogTourCandidate } from "./schemas";
import { conditionRows, renderItineraryDay } from "./editorial";
import { validateCatalogTour } from "./validator";

export function draftCreateData(candidate: CatalogTourCandidate): Prisma.TourCreateInput {
  if (validateCatalogTour(candidate).length) throw new Error("El candidato necesita revisión.");
  return {
    slug: candidate.slug!, status: "DRAFT", isFeatured: false,
    category: candidate.category!, destination: candidate.destination!, difficulty: candidate.difficulty!,
    durationDays: candidate.durationDays!, durationNights: candidate.durationNights!, durationHours: candidate.durationHours,
    nameEs: candidate.nameEs!, nameEn: candidate.nameEn!,
    shortDescEs: candidate.shortDescEs!, shortDescEn: candidate.shortDescEn!,
    longDescEs: candidate.longDescEs!, longDescEn: candidate.longDescEn!,
    metaTitleEs: candidate.metaTitleEs, metaTitleEn: candidate.metaTitleEn, metaDescEs: candidate.metaDescEs, metaDescEn: candidate.metaDescEn,
    itinerary: { create: candidate.itinerary.map((day) => ({
      dayNumber: day.dayNumber, titleEs: day.titleEs!, titleEn: day.titleEn!,
      descriptionEs: renderItineraryDay(day, "Es"), descriptionEn: renderItineraryDay(day, "En"),
    })) },
    // Tiers are the source of price truth. Leave legacy defaults to the existing schema.
    pricing: { create: { tiers: { create: candidate.prices.map((price, sortOrder) => ({
      labelEs: price.labelEs!, labelEn: price.labelEn!, ageMin: price.ageMin, ageMax: price.ageMax,
      priceUsd: price.amount!, isDefault: sortOrder === 0, sortOrder,
    })) } } },
    includes: { create: [
      ...candidate.includesEs.map((textEs, sortOrder) => ({ type: "INCLUDE", textEs, textEn: candidate.includesEn[sortOrder], sortOrder })),
      ...candidate.excludesEs.map((textEs, sortOrder) => ({ type: "EXCLUDE", textEs, textEn: candidate.excludesEn[sortOrder], sortOrder })),
    ] },
    conditions: { create: conditionRows(candidate) },
  };
}
