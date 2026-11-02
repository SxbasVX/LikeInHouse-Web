import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Subdomain allowed for admin panel (configurable via env var)
const ADMIN_HOSTNAME = process.env.ADMIN_HOSTNAME || "panel.likeinhouseperu.com";

// Admin routes that don't require authentication
const PUBLIC_ADMIN_PATHS = ["/admin/login"];


export default async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Dedicated admin subdomain: redirect root to /admin panel
  const isDedicatedAdminHost =
    hostname === ADMIN_HOSTNAME ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost");

  // Vercel preview/production deployments OR dev subdomain: allow both public site AND admin routes
  const isVercelHost = hostname.endsWith(".vercel.app");
  const isDevHost = hostname === "dev.likeinhouseperu.com";

  // On dedicated admin subdomain: redirect root to /admin, allow /admin routes
  if (isDedicatedAdminHost) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Allow /admin routes on dedicated admin host, Vercel deployments, or dev subdomain
  if (pathname.startsWith("/admin") && (isDedicatedAdminHost || isVercelHost || isDevHost)) {
    // Auth check: protect all admin routes except login
    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => pathname === p);
    // Only a quick "has a session cookie" redirect. The real check (session still valid, account active,
    // current role) runs against the database in each layout, page and API, so admin changes apply at once.
    if (!isPublicAdminPath && !getSessionCookie(request)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Block /admin on any other domain (custom public domain) - return 404
  if (pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }

  // All other routes go through next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
