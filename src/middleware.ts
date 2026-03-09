import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Subdomain allowed for admin panel (configurable via env var)
const ADMIN_HOSTNAME = process.env.ADMIN_HOSTNAME || "panel.likeinhouseperu.com";

// Admin routes that don't require authentication
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

// Cookie name must match the one in auth.ts config
const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export default async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  const isAdminHost =
    hostname === ADMIN_HOSTNAME ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost");

  // On admin subdomain: redirect root to /admin, allow /admin routes
  if (isAdminHost) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (pathname.startsWith("/admin")) {
      // Auth check: protect all admin routes except login
      const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => pathname === p);
      if (!isPublicAdminPath) {
        const token = await getToken({
          req: request,
          cookieName: SESSION_COOKIE_NAME,
          secret: process.env.AUTH_SECRET,
        });
        if (!token || !token.id) {
          const loginUrl = new URL("/admin/login", request.url);
          return NextResponse.redirect(loginUrl);
        }
      }
      return NextResponse.next();
    }
  }

  // Block /admin on any other domain - return 404
  if (pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }

  // All other routes go through next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
