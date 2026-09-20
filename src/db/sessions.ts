import "server-only";

import { eq } from "drizzle-orm";
import { db } from "./client";
import { sessions, users } from "./schema";

export async function insertSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await db.insert(sessions).values({ userId, tokenHash, expiresAt });
}

// Ends exactly one Session: the one whose token hashes to tokenHash -- found the same way
// findSessionUser below looks it up, so Cerrar sesión (src/lib/session.ts#endSession) deletes the
// very row that was just validated, never a whole User's other Sessions on other devices (unlike
// updateUserPin in src/db/users.ts, which deletes every Session for that User at once because a
// changed PIN must end access everywhere). A tokenHash matching no row (already expired, already
// deleted) deletes nothing, silently -- Cerrar sesión must never crash just because there was
// nothing left to end.
export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export type SessionUser = { id: string; name: string; isAdmin: boolean; expiresAt: Date };

// Returns the User for a Session token hash regardless of expiry: deciding whether the
// Session is still valid at that expiresAt is the domain core's job (src/domain/access/session.ts),
// not this query's.
export async function findSessionUser(tokenHash: string): Promise<SessionUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      isAdmin: users.isAdmin,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}
