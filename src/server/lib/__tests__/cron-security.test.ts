import { describe, it, expect, vi, beforeEach } from "vitest";
import { timingSafeEqual } from "crypto";

/**
 * Tests for cron endpoint security: timing-safe comparison, auth validation.
 * These tests validate the security logic without needing the full Next.js server.
 */

describe("Cron Secret Validation", () => {
  const CRON_SECRET = "test-secret-12345";

  function validateCronAuth(authHeader: string | null, cronSecret: string | undefined): boolean {
    if (!cronSecret) return false;
    if (!authHeader) return false;

    const expected = `Bearer ${cronSecret}`;
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);

    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  it("should accept valid Bearer token", () => {
    expect(validateCronAuth(`Bearer ${CRON_SECRET}`, CRON_SECRET)).toBe(true);
  });

  it("should reject missing authorization header", () => {
    expect(validateCronAuth(null, CRON_SECRET)).toBe(false);
  });

  it("should reject empty authorization header", () => {
    expect(validateCronAuth("", CRON_SECRET)).toBe(false);
  });

  it("should reject wrong secret", () => {
    expect(validateCronAuth("Bearer wrong-secret", CRON_SECRET)).toBe(false);
  });

  it("should reject when CRON_SECRET is undefined", () => {
    expect(validateCronAuth(`Bearer ${CRON_SECRET}`, undefined)).toBe(false);
  });

  it("should reject token without Bearer prefix", () => {
    expect(validateCronAuth(CRON_SECRET, CRON_SECRET)).toBe(false);
  });

  it("should reject partial match (timing-safe)", () => {
    expect(validateCronAuth("Bearer test-secret-12346", CRON_SECRET)).toBe(false);
  });

  it("should reject Bearer with extra spaces", () => {
    expect(validateCronAuth(`Bearer  ${CRON_SECRET}`, CRON_SECRET)).toBe(false);
  });
});

describe("Rate Limit Window Expiration", () => {
  it("should reset rate limit after window expires", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const config = { maxRequests: 2, windowSeconds: 1 };
    const key = `test-expiry-${Date.now()}`;

    // Exhaust the limit
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    expect(checkRateLimit(key, config).allowed).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Should be allowed again
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });
});
