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
  priceType: z.enum(["per_person", "per_group", "unknown"]).optional(),
  minPassengers: z.number().int().positive().nullable().optional(),
  maxPassengers: z.number().int().positive().nullable().optional(),
  serviceMode: nullableString.optional(),
  notes: nullableString.optional(),
  source: z.enum(["document", "derived"]).optional(),
  calculation: z.object({ baseAmount: z.number().nonnegative(), discount: z.number().nonnegative(), expression: z.string() }).nullable().optional(),
});

export const itineraryItemSchema = z.object({
  time: nullableString,
  titleEs: nullableString,
  titleEn: nullableString,
  descriptionEs: nullableString,
  descriptionEn: nullableString,
});

export const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  titleEs: nullableString,
  titleEn: nullableString,
  descriptionEs: nullableString,
  descriptionEn: nullableString,
  items: z.array(itineraryItemSchema).max(30).optional(),
});

export const catalogTourCandidateSchema = z.object({
  schemaVersion: z.literal(2).optional(),
  sourceDocument: z.string().min(1),
  sourcePages: z.array(z.number().int().positive()).min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).nullable(),
  category: nullableString,
  destination: nullableString,
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]).nullable(),
  durationDays: z.number().int().nonnegative().nullable(),
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
  conditions: z.array(z.object({
    type: z.enum(["HEALTH", "AGE", "BEHAVIOR", "GROUP_SIZE", "PHYSICAL", "GENERAL"]),
    titleEs: nullableString, titleEn: nullableString,
    descriptionEs: nullableString, descriptionEn: nullableString,
  })).optional(),
  attractions: z.array(z.string().min(1)).optional(),
  imageSuggestions: z.array(z.object({
    order: z.number().int().positive(), subject: z.string().min(1),
    recommendedForCover: z.boolean(), reason: z.string().min(1),
  })).max(10).optional(),
  provenance: z.record(z.string(), z.object({
    source: z.enum(["document", "derived", "inferred", "suggested", "manual"]),
    requiresReview: z.boolean(), sourcePages: z.array(z.number().int().positive()),
    evidence: z.string().nullable(),
  })).optional(),
  sourceIssues: z.array(z.object({
    field: z.string(), valueA: nullableString, valueB: nullableString,
    sourcePages: z.array(z.number().int().positive()).min(1), reason: z.string().min(1),
  })).optional(),
  schedule: z.object({
    frequency: z.enum(["daily", "selected_days", "on_request", "unknown"]),
    days: z.array(z.number().int().min(0).max(6)),
    times: z.array(z.string()), dates: z.array(z.string()),
    notesEs: nullableString, notesEn: nullableString,
  }).nullable().optional(),
});

export const catalogExtractionSchema = z.object({
  sourceDocument: z.string().min(1),
  tours: z.array(catalogTourCandidateSchema),
});

export type CatalogTourCandidate = z.infer<typeof catalogTourCandidateSchema>;
export type CatalogExtraction = z.infer<typeof catalogExtractionSchema>;

// Validate the envelope separately: one malformed tour must not reject its siblings.
export const catalogExtractionEnvelopeSchema = z.object({
  sourceDocument: z.string().min(1), tours: z.array(z.unknown()).max(200),
});
export type CatalogExtractionEnvelope = z.infer<typeof catalogExtractionEnvelopeSchema>;
