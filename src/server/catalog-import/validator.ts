import type { CatalogTourCandidate } from "./schemas";

export interface CatalogValidationIssue {
  type: "DATA_REVIEW" | "MISSING_REQUIRED" | "INVALID_VALUE" | "CONTRADICTION";
  field: string;
  reason: string;
  sourcePages: number[];
}

export function validateCatalogTour(candidate: CatalogTourCandidate): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const required: Array<keyof CatalogTourCandidate> = [
    "nameEs", "nameEn", "category", "destination", "durationDays",
    "durationNights", "shortDescEs", "shortDescEn", "longDescEs", "longDescEn",
  ];

  for (const field of required) {
    if (candidate[field] === null || candidate[field] === "") {
      issues.push({
        type: "MISSING_REQUIRED",
        field: String(field),
        reason: "El PDF no contiene este dato obligatorio.",
        sourcePages: candidate.sourcePages,
      });
    }
  }

  if (candidate.durationNights !== null && candidate.durationDays !== null &&
      candidate.durationNights > candidate.durationDays) {
    issues.push({
      type: "CONTRADICTION",
      field: "durationNights",
      reason: "Las noches no pueden superar los días de duración.",
      sourcePages: candidate.sourcePages,
    });
  }

  if (candidate.prices.length === 0) {
    issues.push({
      type: "DATA_REVIEW",
      field: "prices",
      reason: "No se encontró ningún precio en el PDF.",
      sourcePages: candidate.sourcePages,
    });
  }

  for (const [index, price] of candidate.prices.entries()) {
    if (price.amount === null) {
      issues.push({
        type: "MISSING_REQUIRED",
        field: `prices.${index}.amount`,
        reason: "El precio no está indicado de forma verificable en el PDF.",
        sourcePages: candidate.sourcePages,
      });
    }
    if (price.currency !== null && price.currency !== "USD") {
      issues.push({
        type: "INVALID_VALUE",
        field: `prices.${index}.currency`,
        reason: "Los precios importados deben estar expresados en USD.",
        sourcePages: candidate.sourcePages,
      });
    }
  }

  return issues;
}
