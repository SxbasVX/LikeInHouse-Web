import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ItineraryBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string };

export function parseItineraryDescription(value: string): ItineraryBlock[] {
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const heading = block.match(/^\*\*([\s\S]+?)\*\*$/);
      return heading
        ? { type: "heading", text: heading[1].trim() }
        : { type: "paragraph", text: block.replace(/\*\*([\s\S]+?)\*\*/g, "$1") };
    });
}

/**
 * Format tour duration for display.
 * - Full day tours: "4D / 3N"
 * - Half/hour-based tours: "4h"
 */
export function formatDuration(
  durationDays: number,
  durationNights: number,
  durationHours?: number | null,
): string {
  if (durationDays > 0) {
    return `${durationDays}D / ${durationNights}N`;
  }
  return `${durationHours || 0}h`;
}
