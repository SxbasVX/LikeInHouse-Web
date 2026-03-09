import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Subdomain allowed for admin panel (configurable via env var)
const ADMIN_HOSTNAME = process.env.ADMIN_HOSTNAME || "panel.likeinhouseperu.com";

export default function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Block /admin routes unless accessed from the admin subdomain
  if (pathname.startsWith("/admin")) {
    const isAdminHost =
      hostname === ADMIN_HOSTNAME ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost");

    if (!isAdminHost) {
      // Return 404 - don't reveal that /admin exists
      return NextResponse.rewrite(new URL("/_not-found", request.url));
    }

    // Admin routes don't need i18n middleware
    return NextResponse.next();
  }

  // All other routes go through next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
