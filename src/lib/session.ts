import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isSessionValid, sessionExpiresAt } from "@/domain/access/session";
import { findSessionUser, insertSession } from "@/db/sessions";
import type { SignedInUser } from "@/db/users";
import { SESSION_COOKIE_NAME } from "./session-cookie";
import { generateSessionToken, hashSessionToken } from "./session-token";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

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
