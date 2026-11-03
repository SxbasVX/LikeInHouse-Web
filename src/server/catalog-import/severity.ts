// Which review issues stop a tour from being created, which need an explicit confirmation on approval,
// and which a reviewer may accept by marking them as seen.
// One source of truth for the server (status, draft creation) and the review screen.
import { CONFIRM_REASONS } from "./validator";

export interface IssueLike { type: string; field: string | null; reason?: string }
export type IssueKind = "blocking" | "confirm" | "warning";

// Advisory types that still protect the published tour: prices, rate, hours of a day tour, paired ES/EN lists.
const BLOCKING_REVIEW_FIELDS = [/^prices$/, /^prices\.\d+$/, /^prices\.\d+\.(label|calculation)$/, /^priceAdjustment$/, /^durationHours$/, /^(includes|excludes|conditions)En$/];
// Facts that sell the tour: their evidence or contradictions are settled by confirming on approval (with the note), never by a tick alone.
const MONEY_OR_TIME = /^(prices|duration)/;
const CONFIRMATIONS = new Set<string>(Object.values(CONFIRM_REASONS));

export function issueKind(issue: IssueLike): IssueKind {
  const field = issue.field ?? "";
  const confirmation = issue.reason !== undefined && CONFIRMATIONS.has(issue.reason);
  if (confirmation) return MONEY_OR_TIME.test(field) ? "confirm" : "warning";
  switch (issue.type) {
    case "POSSIBLE_DUPLICATE": case "PROVIDER_ERROR": case "INVALID_VALUE": return "blocking";
    // SEO texts are optional on a tour; everything else marked required really is.
    case "MISSING_REQUIRED": return field.startsWith("meta") ? "warning" : "blocking";
    // Nights longer than days is a broken tour; a PDF contradiction on a price or duration must be confirmed; others are settled by the reviewer.
    case "CONTRADICTION": return field === "durationNights" ? "blocking" : MONEY_OR_TIME.test(field) ? "confirm" : "warning";
    default: return BLOCKING_REVIEW_FIELDS.some((rule) => rule.test(field)) ? "blocking" : "warning";
  }
}

export const isBlockingIssue = (issue: IssueLike) => issueKind(issue) === "blocking";

/** READY only when nothing blocks, nothing awaits confirmation and every warning was accepted (marked as seen). */
export function statusFromIssues(issues: Array<IssueLike & { checkedAt?: Date | string | null }>, hasDuplicate: boolean): "DUPLICATE" | "NEEDS_REVIEW" | "READY" {
  if (hasDuplicate) return "DUPLICATE";
  return issues.some((issue) => issueKind(issue) !== "warning" || !issue.checkedAt) ? "NEEDS_REVIEW" : "READY";
}
