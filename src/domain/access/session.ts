// A signed-in Session is server-side and lives for 7 days from sign-in (see ADR-0001).
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface Session {
  expiresAt: Date;
}

// Valid strictly before expiresAt; invalid at and after it.
export function isSessionValid(session: Session, now: Date): boolean {
  return now.getTime() < session.expiresAt.getTime();
}

export function sessionExpiresAt(signInAt: Date): Date {
  return new Date(signInAt.getTime() + SESSION_DURATION_MS);
}
