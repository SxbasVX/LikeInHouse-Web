/**
 * In-memory rate limiter.
 * NOTA: En Vercel (serverless), cada invocación puede correr en una instancia
 * diferente, por lo que este rate limiter es best-effort (por instancia).
 * Para rate limiting estricto en serverless, considerar Vercel KV o Upstash Redis.
 * Para una MYPE con tráfico bajo, este approach es aceptable.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Allow Node.js process to exit even if timer is still running
  if (cleanupTimer.unref) cleanupTimer.unref();
}

startCleanup();

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

/**
 * Check if a request is allowed under the rate limit.
 * @param key - Unique identifier (e.g., IP + endpoint)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
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
} as const;
