import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// Optimistic check only: it just looks for the cookie, so a stolen or expired token still
// passes here. Real Session validation happens server-side in requireUser() (src/lib/session.ts),
// which every page and server action calls before reading data. See the Next.js authentication
// guide's "Optimistic checks with Proxy" section.
const PUBLIC_PATHS = new Set(["/ingresar"]);

export function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) {
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
