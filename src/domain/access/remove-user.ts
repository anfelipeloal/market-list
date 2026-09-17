import type { User } from "./entities";
import { isLastAdmin } from "./last-admin";

export type RemoveUserResult =
  | { outcome: "notFound" }
  | { outcome: "lastAdmin" }
  | { outcome: "allowed"; user: User };

// Validates removing a User (ticket #13): refuses when the target is the Household's only Admin,
// so the Household is never left without one (CONTEXT.md — "A Household always has at least one
// Admin"), via the shared isLastAdmin invariant (./last-admin.ts) — also used by validateRevokeAdmin
// (./revoke-admin.ts), which refuses for the same reason. Removing a non-Admin, or an Admin while
// another Admin remains, is allowed. Does not touch the database: the caller
// (src/app/(app)/usuarios/actions.ts) deletes the row, which cascades to that User's Sessions (see
// src/db/schema.ts, sessions.userId onDelete: "cascade"), ending their access immediately.
export function validateUserRemoval(existingUsers: readonly User[], userId: string): RemoveUserResult {
  const user = existingUsers.find((candidate) => candidate.id === userId);
  if (!user) return { outcome: "notFound" };

  if (isLastAdmin(userId, existingUsers)) return { outcome: "lastAdmin" };

  return { outcome: "allowed", user };
}
