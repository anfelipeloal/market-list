import "server-only";

import { eq } from "drizzle-orm";
import { db } from "./client";
import { sessions, users } from "./schema";

export async function insertSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await db.insert(sessions).values({ userId, tokenHash, expiresAt });
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
