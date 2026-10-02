import { z } from "zod";

export const catalogImportStatusSchema = z.enum([
  "UPLOADED",
  "PROCESSING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
]);

export const catalogImportTourStatusSchema = z.enum([
  "EXTRACTED",
  "VALIDATED",
  "READY",
  "NEEDS_REVIEW",
  "DUPLICATE",
  "BLOCKED",
  "DRAFT_CREATED",
  "FAILED",
]);

export const importIssueTypeSchema = z.enum([
  "DATA_REVIEW",
  "CONTRADICTION",
  "MISSING_REQUIRED",
  "INVALID_VALUE",
  "POSSIBLE_DUPLICATE",
  "PROVIDER_ERROR",
]);

const nullableString = z.string().trim().min(1).nullable();

export const priceTierSchema = z.object({
  labelEs: nullableString,
  labelEn: nullableString,
  ageMin: z.number().int().min(0).nullable(),
  ageMax: z.number().int().min(0).nullable(),
  amount: z.number().nonnegative().nullable(),
  currency: z.string().length(3).nullable(),
});

export const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  titleEs: nullableString,
  titleEn: nullableString,
  descriptionEs: nullableString,
  descriptionEn: nullableString,
});

export const catalogTourCandidateSchema = z.object({
  sourceDocument: z.string().min(1),
  sourcePages: z.array(z.number().int().positive()).min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).nullable(),
  category: nullableString,
  destination: nullableString,
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]).nullable(),
  durationDays: z.number().int().positive().nullable(),
  durationNights: z.number().int().min(0).nullable(),
  durationHours: z.number().int().positive().nullable(),
  nameEs: nullableString,
  nameEn: nullableString,
  shortDescEs: nullableString,
  shortDescEn: nullableString,
  longDescEs: nullableString,
  longDescEn: nullableString,
  metaTitleEs: nullableString,
  metaDescEs: nullableString,
  metaTitleEn: nullableString,
  metaDescEn: nullableString,
  prices: z.array(priceTierSchema),
  itinerary: z.array(itineraryDaySchema),
  includesEs: z.array(z.string().trim().min(1)),
  includesEn: z.array(z.string().trim().min(1)),
  excludesEs: z.array(z.string().trim().min(1)),
  excludesEn: z.array(z.string().trim().min(1)),
  conditionsEs: z.array(z.string().trim().min(1)),
  conditionsEn: z.array(z.string().trim().min(1)),
});

export const catalogExtractionSchema = z.object({
  sourceDocument: z.string().min(1),
  tours: z.array(catalogTourCandidateSchema),
});

export type CatalogTourCandidate = z.infer<typeof catalogTourCandidateSchema>;
export type CatalogExtraction = z.infer<typeof catalogExtractionSchema>;
