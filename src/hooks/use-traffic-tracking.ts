"use client";

import { useEffect } from "react";

const STORAGE_KEY_FIRST = "traffic_first_source";
const STORAGE_KEY_LAST = "traffic_last_source";
const STORAGE_KEY_UTM = "traffic_utm";
const STORAGE_KEY_EXPIRES = "traffic_expires";
const EXPIRY_DAYS = 30;

// Known source domains for referrer detection
const REFERRER_SOURCES: Record<string, string> = {
  "instagram.com": "instagram",
  "l.instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "facebook.com": "facebook",
  "l.facebook.com": "facebook",
  "lm.facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "google.com": "google",
  "google.com.pe": "google",
  "google.co.uk": "google",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "t.co": "twitter",
  "youtube.com": "youtube",
  "m.youtube.com": "youtube",
};

// Valid source values (for sanitization)
const KNOWN_SOURCES = [
  "instagram",
  "tiktok",
  "facebook",
  "google",
  "twitter",
  "youtube",
  "direct",
  "referral",
];

export interface TrafficData {
  firstSource: string;
  lastSource: string;
  utmSource: string | null;
  utmCampaign: string | null;
  utmMedium: string | null;
  utmContent: string | null;
}

function sanitizeValue(value: string | null, maxLen = 100): string | null {
  if (!value) return null;
  // Remove anything that isn't alphanumeric, dash, underscore, or dot
  const clean = value.trim().toLowerCase().replace(/[^a-z0-9\-_.]/g, "").slice(0, maxLen);
  return clean || null;
}

function detectSourceFromReferrer(): string {
  if (typeof document === "undefined") return "direct";
  const referrer = document.referrer;
  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.replace(/^www\./, "");

    // Check known sources
    for (const [domain, source] of Object.entries(REFERRER_SOURCES)) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        return source;
      }
    }

    // If referrer exists but isn't known, it's a referral
    return "referral";
  } catch {
    return "direct";
  }
}

function detectSourceFromParams(params: URLSearchParams): string | null {
  // Check explicit src parameter first
  const src = sanitizeValue(params.get("src"));
  if (src) {
    return KNOWN_SOURCES.includes(src) ? src : src;
  }

  // Check utm_source
  const utmSource = sanitizeValue(params.get("utm_source"));
  if (utmSource) {
    return KNOWN_SOURCES.includes(utmSource) ? utmSource : utmSource;
  }

  return null;
}

function isExpired(): boolean {
  if (typeof localStorage === "undefined") return true;
  const expires = localStorage.getItem(STORAGE_KEY_EXPIRES);
  if (!expires) return true;
  return Date.now() > Number(expires);
}

function setExpiry(): void {
  const expires = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEY_EXPIRES, String(expires));
}

/**
 * Hook that captures traffic source on every page load.
 * Stores first-touch and last-touch attribution in localStorage.
 */
export function useTrafficTracking(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);

      // Detect source from params or referrer
      const paramSource = detectSourceFromParams(params);
      const currentSource = paramSource || detectSourceFromReferrer();

      // Extract UTM data
      const utmData = {
        utmSource: sanitizeValue(params.get("utm_source")),
        utmCampaign: sanitizeValue(params.get("utm_campaign")),
        utmMedium: sanitizeValue(params.get("utm_medium")),
        utmContent: sanitizeValue(params.get("utm_content")),
      };

      // Check if data has expired
      if (isExpired()) {
        localStorage.removeItem(STORAGE_KEY_FIRST);
        localStorage.removeItem(STORAGE_KEY_LAST);
        localStorage.removeItem(STORAGE_KEY_UTM);
      }

      // Set first source (only if not already set)
      const existingFirst = localStorage.getItem(STORAGE_KEY_FIRST);
      if (!existingFirst) {
        localStorage.setItem(STORAGE_KEY_FIRST, currentSource);
      }

      // Always update last source (last-touch attribution)
      localStorage.setItem(STORAGE_KEY_LAST, currentSource);

      // Update UTM data if any param is present
      const hasUtm = utmData.utmSource || utmData.utmCampaign || utmData.utmMedium || utmData.utmContent;
      if (hasUtm) {
        localStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(utmData));
      }

      // Reset expiry on each visit
      setExpiry();
    } catch {
      // Silently fail - tracking should never break the site
    }
  }, []);
}

/**
 * Get current tracking data from localStorage.
 * Call this when creating a reservation/purchase.
 */
export function getTrafficData(): TrafficData {
  if (typeof localStorage === "undefined") {
    return {
      firstSource: "direct",
      lastSource: "direct",
      utmSource: null,
      utmCampaign: null,
      utmMedium: null,
      utmContent: null,
    };
  }

  try {
    const firstSource = localStorage.getItem(STORAGE_KEY_FIRST) || "direct";
    const lastSource = localStorage.getItem(STORAGE_KEY_LAST) || "direct";

    let utmData = { utmSource: null, utmCampaign: null, utmMedium: null, utmContent: null } as {
      utmSource: string | null;
      utmCampaign: string | null;
      utmMedium: string | null;
      utmContent: string | null;
    };

    const utmRaw = localStorage.getItem(STORAGE_KEY_UTM);
    if (utmRaw) {
      try {
        const parsed = JSON.parse(utmRaw);
        utmData = {
          utmSource: parsed.utmSource || null,
          utmCampaign: parsed.utmCampaign || null,
          utmMedium: parsed.utmMedium || null,
          utmContent: parsed.utmContent || null,
        };
      } catch {
        // Invalid JSON, ignore
      }
    }

    return {
      firstSource,
      lastSource,
      ...utmData,
    };
  } catch {
    return {
      firstSource: "direct",
      lastSource: "direct",
      utmSource: null,
      utmCampaign: null,
      utmMedium: null,
      utmContent: null,
    };
  }
}
