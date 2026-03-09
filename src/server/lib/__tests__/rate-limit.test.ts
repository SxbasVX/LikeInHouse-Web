import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
    const config = { maxRequests: 3, windowSeconds: 60 };

    beforeEach(() => {
        // Each test gets a unique key to avoid state contamination
    });

    it("should allow requests within the limit", () => {
        const key = `test-${Date.now()}-allow`;
        const result1 = checkRateLimit(key, config);
        const result2 = checkRateLimit(key, config);
        const result3 = checkRateLimit(key, config);

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
        expect(result3.allowed).toBe(true);
    });

    it("should block requests exceeding the limit", () => {
        const key = `test-${Date.now()}-block`;
        checkRateLimit(key, config);
        checkRateLimit(key, config);
        checkRateLimit(key, config);
        const result = checkRateLimit(key, config);

        expect(result.allowed).toBe(false);
    });

    it("should use separate limits for different keys", () => {
        const key1 = `test-${Date.now()}-key1`;
        const key2 = `test-${Date.now()}-key2`;

        checkRateLimit(key1, config);
        checkRateLimit(key1, config);
        checkRateLimit(key1, config);

        // key1 should be blocked
        expect(checkRateLimit(key1, config).allowed).toBe(false);
        // key2 should still be allowed
        expect(checkRateLimit(key2, config).allowed).toBe(true);
    });
});
