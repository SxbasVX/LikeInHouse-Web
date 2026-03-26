/**
 * In-memory rate limiter.
 * NOTA: En Vercel (serverless), cada invocación puede correr en una instancia
 * diferente, por lo que este rate limiter es best-effort (por instancia).
 * Para rate limiting estricto en serverless, considerar Vercel KV o Upstash Redis.
 * Para una MYPE con tráfico bajo, este approach es aceptable.
 */

import { LRUCache } from "lru-cache";

interface RateLimitEntry {
  count: number;
}

// Global LRU Cache for rate limiting
// Utiliza un global object para sobrevivir Hot-Reloads en desarrollo (HMR).
const globalForRateLimit = globalThis as unknown as {
  rateLimitCache: LRUCache<string, RateLimitEntry> | undefined;
};

// 1 Hour max age in memory, up to 5000 distinct IP/Email combinations
const store =
  globalForRateLimit.rateLimitCache ??
  new LRUCache<string, RateLimitEntry>({
    max: 5000,
    ttl: 1000 * 60 * 60, // 1 hour absolute max for any entry
  });

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitCache = store;
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();

  // LRUCache returns undefined if entry expired or doesn't exist
  let entry = store.get(key);

  if (!entry) {
    // New window
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1 }, { ttl: config.windowSeconds * 1000 });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // To compute remainders and reset we estimate the absolute TTL. 
  // LRUCache doesn't easily return the exact expiration timestamp for a key in v10+,
  // so we approximate it for the client headers or just return an arbitrary future time.
  const resetAt = now + config.windowSeconds * 1000;

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  entry.count += 1;
  // We don't update the TTL on increment to keep a strictly fixed window size

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt,
  };
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  /** Public mutations: 10 requests per minute */
  publicMutation: { maxRequests: 10, windowSeconds: 60 },
  /** Contact form: 3 per 15 minutes (M6: more restrictive) */
  contactForm: { maxRequests: 3, windowSeconds: 900 },
  /** Guest reservation: 5 per 10 minutes */
  guestReservation: { maxRequests: 5, windowSeconds: 600 },
  /** PayPal operations: 10 per 5 minutes */
  paypal: { maxRequests: 10, windowSeconds: 300 },
  /** Login attempts: 5 per 15 minutes */
  login: { maxRequests: 5, windowSeconds: 900 },
  /** Payment link operations: 10 per 5 minutes */
  paymentLink: { maxRequests: 10, windowSeconds: 300 },
  /** Public payment link lookup: 15 per minute */
  publicLookup: { maxRequests: 15, windowSeconds: 60 },
} as const;
