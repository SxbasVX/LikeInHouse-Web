import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/root";
import { createTRPCContext } from "@/server/trpc/trpc";

/**
 * CSRF protection: Validate Origin header on mutation requests.
 * tRPC mutations use POST with Content-Type: application/json which provides
 * basic protection, but we add explicit Origin validation for defense in depth.
 */
function validateOrigin(req: Request): boolean {
  // Only validate POST requests (mutations)
  if (req.method !== "POST") return true;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const allowedOrigins = new Set([
    new URL(baseUrl).origin,
  ]);

  // Only allow localhost in development
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
  }

  // If origin header is present, validate it
  if (origin) {
    return allowedOrigins.has(origin);
  }

  // If no origin but referer exists, validate referer
  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  // Server-side calls (no origin/referer) are allowed (e.g., tRPC callers)
  // Browser requests always include origin/referer for POST
  return true;
}

const handler = (req: Request) => {
  if (!validateOrigin(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
};

export { handler as GET, handler as POST };
