import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// Optimistic check only: it just looks for the cookie, so a stolen or expired token still
// passes here. Real Session validation happens server-side in requireUser() (src/lib/session.ts),
// which every page and server action calls before reading data. See the Next.js authentication
// guide's "Optimistic checks with Proxy" section.
//
// Also public (ticket #17): the PWA installability files and the service worker script. None of
// them carry any Household data -- the manifest is static branding, the icons are a generated
// glyph (src/lib/app-icon.tsx), and public/sw.js is the same file for every User -- and a browser
// must be able to fetch all of them without a session cookie for "Add to Home Screen" to work
// before a User has ever signed in, and for the service worker to register and update regardless
// of session state. Redirecting any of them to /ingresar would make a manifest fetch resolve to an
// HTML page instead of JSON, which browsers treat as "not installable".
const PUBLIC_PATHS = new Set(["/ingresar", "/manifest.webmanifest", "/sw.js", "/apple-icon"]);
// Prefix, not exact match: the manifest's icons are a parameterized route
// (src/app/icons/[size]/route.tsx), e.g. /icons/192 and /icons/512.
const PUBLIC_PATH_PREFIXES = ["/icons/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/ingresar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
