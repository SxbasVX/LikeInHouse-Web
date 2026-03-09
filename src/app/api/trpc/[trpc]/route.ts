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
  const adminHostname = process.env.ADMIN_HOSTNAME || "panel.likeinhouseperu.com";
  const allowedOrigins = new Set([
    new URL(baseUrl).origin,
    `https://${adminHostname}`,
  ]);

  // Only allow localhost in development
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
  }

  const sourceOrigin = origin || (referer ? (() => { try { return new URL(referer).origin; } catch { return null; } })() : null);

  if (!sourceOrigin) {
    // Server-side calls (no origin/referer) are allowed (e.g., tRPC callers)
    return true;
  }

  // Check exact match first
  if (allowedOrigins.has(sourceOrigin)) return true;

  // Allow Vercel preview/production deployments (*.vercel.app)
  try {
    const url = new URL(sourceOrigin);
    if (url.hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  return false;
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
