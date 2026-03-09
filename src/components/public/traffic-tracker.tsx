"use client";

import { useTrafficTracking } from "@/hooks/use-traffic-tracking";

/**
 * Invisible component that captures traffic source data on every page load.
 * Place once in the public layout.
 */
export function TrafficTracker() {
  useTrafficTracking();
  return null;
}
