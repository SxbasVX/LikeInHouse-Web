import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
