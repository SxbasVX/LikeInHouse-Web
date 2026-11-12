// Which review issues stop a tour from being created, which ask the reviewer for one tick,
// and which are only notes (accepted automatically).
// One source of truth for the server (status, draft creation) and the review screen.
import { AUTO_NOTE_PREFIX, CONFIRM_REASONS, NOTE_REASONS, VERIFY_PREFIX } from "./validator";

export interface IssueLike { type: string; field: string | null; reason?: string }
/** blocking = fix the data; warning = verify and tick; info = a note, nothing to do. */
export type IssueKind = "blocking" | "warning" | "info";

// Advisory types that still protect the published tour: prices, rate, hours of a day tour, paired ES/EN lists.
const BLOCKING_REVIEW_FIELDS = [/^prices$/, /^prices\.\d+$/, /^prices\.\d+\.(label|calculation)$/, /^priceAdjustment$/, /^durationHours$/, /^(includes|excludes|conditions)En$/];
// What the customer pays and how long the tour lasts: a doubt the model raised on these is worth one look.
const SOLD_FACTS = /^(prices|durationDays|durationNights|destination)/;
// A contradiction in the PDF needs a look when it touches what is sold; fine print repeated on every tour is only a note.
const CONTRADICTION_FIELDS = /^(prices|duration|destination|schedule|includes|excludes|itinerary)/;
const NOTES = new Set<string>(Object.values(NOTE_REASONS));
export const CLAUDE_SUGGESTION_PREFIX = "Sugerencia de Claude";

export function issueKind(issue: IssueLike): IssueKind {
  const field = issue.field ?? "", reason = issue.reason ?? "";
  if (reason.startsWith(VERIFY_PREFIX)) return "warning";
  // Claude only rewrites editorial fields (texts, SEO, images): the facts of the PDF are restored by the server.
  if (reason.startsWith(AUTO_NOTE_PREFIX) || reason.startsWith(CLAUDE_SUGGESTION_PREFIX) || NOTES.has(reason)) return "info";
  // Traceability bookkeeping, not a doubt about the value.
  if (reason === CONFIRM_REASONS.foreignPages || reason === CONFIRM_REASONS.missingProvenance) return "info";
  if (reason === CONFIRM_REASONS.proposal) return SOLD_FACTS.test(field) ? "warning" : "info";
  switch (issue.type) {
    case "POSSIBLE_DUPLICATE": case "PROVIDER_ERROR": case "INVALID_VALUE": return "blocking";
    // SEO texts are optional on a tour; everything else marked required really is.
    case "MISSING_REQUIRED": return field.startsWith("meta") ? "info" : "blocking";
    // Nights longer than days is a broken tour; a contradiction about what is sold is settled by the reviewer with a tick.
    case "CONTRADICTION": return field === "durationNights" ? "blocking" : CONTRADICTION_FIELDS.test(field) ? "warning" : "info";
    default: return BLOCKING_REVIEW_FIELDS.some((rule) => rule.test(field)) ? "blocking" : "warning";
  }
}

export const isBlockingIssue = (issue: IssueLike) => issueKind(issue) === "blocking";

/** READY when nothing blocks and every warning was accepted (ticked). Notes never hold a tour back. */
export function statusFromIssues(issues: Array<IssueLike & { checkedAt?: Date | string | null }>, hasDuplicate: boolean): "DUPLICATE" | "NEEDS_REVIEW" | "READY" {
  if (hasDuplicate) return "DUPLICATE";
  return issues.some((issue) => { const kind = issueKind(issue); return kind === "blocking" || (kind === "warning" && !issue.checkedAt); }) ? "NEEDS_REVIEW" : "READY";
}

/** Open work on a tour, for the lists and the bulk actions. */
export function pendingCounts(issues: Array<IssueLike & { checkedAt?: Date | string | null }>) {
  let blocking = 0, toVerify = 0, notes = 0;
  for (const issue of issues) {
    const kind = issueKind(issue);
    if (kind === "blocking") blocking++; else if (kind === "info") notes++; else if (!issue.checkedAt) toVerify++;
  }
  return { blocking, toVerify, notes };
}
