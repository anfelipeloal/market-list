import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { decideAdminAction } from "@/domain/access/permissions";
import { SESSION_DURATION_MS, isSessionValid, sessionExpiresAt } from "@/domain/access/session";
import { findSessionUser, insertSession } from "@/db/sessions";
import type { SignedInUser } from "@/db/users";
import { SESSION_COOKIE_NAME } from "./session-cookie";
import { generateSessionToken, hashSessionToken } from "./session-token";

// The cookie's max-age must track the Session's actual lifetime, so it's derived from the same
// domain constant that computes expiresAt rather than a second, independently maintained value.
const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

// Creates a server-side Session for userId and sets the cookie that identifies it. Called once,
// right after a PIN is verified.
export async function createSessionCookie(userId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = sessionExpiresAt(new Date());
  await insertSession(userId, hashSessionToken(token), expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

// The real (non-optimistic) Session check: every page and server action that reads data must
// call this. Redirects to the PIN screen when there is no cookie, no matching Session, or the
// Session has expired. Cached per request so multiple calls during one render only hit the
// database once (see the Next.js authentication guide's Data Access Layer pattern).
export const requireUser = cache(async (): Promise<SignedInUser> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await findSessionUser(hashSessionToken(token)) : null;

  if (!session || !isSessionValid({ expiresAt: session.expiresAt }, new Date())) {
    redirect("/ingresar");
  }

  return { id: session.id, name: session.name, isAdmin: session.isAdmin };
});

export type RequireAdminResult = { outcome: "allowed"; user: SignedInUser } | { outcome: "forbidden" };

// The server-side guard behind every Admin-only action (ticket #12, Reset, is the first; #13, #14
// and #15 reuse it — see CONTEXT.md's Admin definition). Resolves the acting User via
// requireUser() first, exactly like every other action (redirecting to the PIN screen if there is
// no valid session), then applies the pure Admin decision (src/domain/access/permissions.ts) to
// that User's Admin flag.
//
// A non-Admin is refused with a typed result rather than a thrown error, so the caller (a server
// action) can turn that refusal into ordinary data the UI shows as a Spanish message, instead of a
// 500. Hiding the button that triggers an Admin-only action (see
// src/app/(app)/lista/shopping-list-view.tsx) is never the only protection: this check runs on
// every call, regardless of what the UI renders.
export async function requireAdmin(): Promise<RequireAdminResult> {
  const user = await requireUser();
  const decision = decideAdminAction(user.isAdmin);
  return decision.outcome === "allowed" ? { outcome: "allowed", user } : { outcome: "forbidden" };
}
