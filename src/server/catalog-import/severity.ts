// Which review issues stop a tour from being created and which ones a reviewer may accept by marking them as seen.
// One source of truth for the server (status, draft creation) and the review screen.

export interface IssueLike { type: string; field: string | null }

// Advisory types that still protect the published tour: prices, rate, hours of a day tour, paired ES/EN lists.
const BLOCKING_REVIEW_FIELDS = [/^prices$/, /^prices\.\d+$/, /^prices\.\d+\.(label|calculation)$/, /^priceAdjustment$/, /^durationHours$/, /^(includes|excludes|conditions)En$/];

export function isBlockingIssue(issue: IssueLike): boolean {
  const field = issue.field ?? "";
  switch (issue.type) {
    case "POSSIBLE_DUPLICATE": case "PROVIDER_ERROR": case "INVALID_VALUE": return true;
    // SEO texts are optional on a tour; everything else marked required really is.
    case "MISSING_REQUIRED": return !field.startsWith("meta");
    // A PDF contradiction is settled by the reviewer; nights longer than days is a broken tour.
    case "CONTRADICTION": return field === "durationNights";
    default: return BLOCKING_REVIEW_FIELDS.some((rule) => rule.test(field));
  }
}

/** READY only when nothing blocks and every advisory issue was accepted (marked as seen). */
export function statusFromIssues(issues: Array<IssueLike & { checkedAt?: Date | string | null }>, hasDuplicate: boolean): "DUPLICATE" | "NEEDS_REVIEW" | "READY" {
  if (hasDuplicate) return "DUPLICATE";
  return issues.some((issue) => isBlockingIssue(issue) || !issue.checkedAt) ? "NEEDS_REVIEW" : "READY";
}
