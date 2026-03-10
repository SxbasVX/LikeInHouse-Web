import { Decimal } from "@prisma/client/runtime/library";

/**
 * Recursively converts Prisma Decimal instances to plain numbers for tRPC/SuperJSON serialization.
 * Handles nested objects, arrays, and skips Date instances.
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Decimal) return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeDecimals) as unknown as T;
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = serializeDecimals((obj as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return obj;
}
