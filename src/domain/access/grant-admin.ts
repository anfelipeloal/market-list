import type { User } from "./entities";

export type GrantAdminResult = { outcome: "notFound" } | { outcome: "allowed"; user: User };

// Validates granting the Admin role to a User (ticket #14, CONTEXT.md's Admin): unlike revoking
// (see validateRevokeAdmin, src/domain/access/revoke-admin.ts), granting never threatens the
// Household's "always at least one Admin" invariant, so the only outcome besides "allowed" is an
// unknown User — the same notFound guard as validateUserRemoval and validateUserRename. Granting
// to a User who already is an Admin is allowed too (a harmless no-op write).
//
// Parameter order is (existingUsers, userId) — current state first, then the target — the same
// order every Access validator that targets an existing User uses (validateUserRemoval,
// validateUserRename, validateRevokeAdmin, validatePinChange).
export function validateGrantAdmin(existingUsers: readonly User[], userId: string): GrantAdminResult {
  const user = existingUsers.find((candidate) => candidate.id === userId);
  if (!user) return { outcome: "notFound" };

  return { outcome: "allowed", user };
}
