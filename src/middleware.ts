import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { FAMILY_ROUTE_PREFIX, getFamilyBaseUrl, isFamilyHost } from "./lib/family-site";

const intlMiddleware = createMiddleware(routing);

// Subdomain allowed for admin panel (configurable via env var)
const ADMIN_HOSTNAME = process.env.ADMIN_HOSTNAME || "panel.likeinhouseperu.com";

// Admin routes that don't require authentication
const PUBLIC_ADMIN_PATHS = ["/admin/login"];


// Web familiar: familia.likeinhouseperu.com muestra el árbol `src/app/familia/[locale]`.
// Las URLs públicas no llevan "/familia": /es/tours se sirve desde /familia/es/tours.
function familyMiddleware(request: NextRequest, host: string) {
  const { pathname } = request.nextUrl;
  // Las redirecciones mantienen el subdominio aunque nextUrl venga con otro host.
  const onFamilyHost = (url: URL) => {
    url.host = host;
    const proto = request.headers.get("x-forwarded-proto");
    if (proto === "http" || proto === "https") url.protocol = `${proto}:`;
    return url;
  };
  if (pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }
  // Quien llegue con /familia en la URL vuelve a la ruta limpia.
  if (pathname === FAMILY_ROUTE_PREFIX || pathname.startsWith(`${FAMILY_ROUTE_PREFIX}/`)) {
    const clean = onFamilyHost(request.nextUrl.clone());
    clean.pathname = pathname.slice(FAMILY_ROUTE_PREFIX.length) || "/";
    return NextResponse.redirect(clean);
  }

  const intlResponse = intlMiddleware(request);
  // next-intl redirige cuando falta el idioma (/ → /es); esa redirección se respeta tal cual.
  const location = intlResponse.headers.get("location");
  if (location) {
    intlResponse.headers.set("location", onFamilyHost(new URL(location, request.url)).toString());
    return intlResponse;
  }

  const target = request.nextUrl.clone();
  target.pathname = `${FAMILY_ROUTE_PREFIX}${pathname}`;
  const rewrite = NextResponse.rewrite(target);
  // Conserva lo que next-intl preparó (cookie de idioma, cabeceras de la petición con el locale, hreflang).
  intlResponse.headers.forEach((value, key) => {
    if (key === "x-middleware-next" || key === "x-middleware-rewrite") return;
    if (key === "set-cookie") rewrite.headers.append(key, value);
    else rewrite.headers.set(key, value);
  });
  return rewrite;
}

export default async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // El host real llega en las cabeceras (nextUrl.hostname puede quedar como "localhost" detrás de un proxy o en `next start`).
  const requestHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || hostname;
  if (isFamilyHost(requestHost)) return familyMiddleware(request, requestHost);

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

  // /familia/... directo: en Vercel y dev se deja pasar para probar sin subdominio;
  // en el dominio público se manda al subdominio con la misma ruta.
  if (pathname === FAMILY_ROUTE_PREFIX || pathname.startsWith(`${FAMILY_ROUTE_PREFIX}/`)) {
    if (isVercelHost || isDevHost || hostname === "localhost") return NextResponse.next();
    const dest = new URL(getFamilyBaseUrl());
    dest.pathname = pathname.slice(FAMILY_ROUTE_PREFIX.length) || "/";
    dest.search = request.nextUrl.search;
    return NextResponse.redirect(dest, 308);
  }

  // All other routes go through next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
