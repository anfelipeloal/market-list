import type { User } from "./entities";

// The Household's "always at least one Admin" invariant (CONTEXT.md), shared by every action that
// can take an Admin's role away: removing a User (validateUserRemoval, ./remove-user.ts) and
// revoking the Admin role (validateRevokeAdmin, ./revoke-admin.ts) both refuse exactly when their
// target is the Household's only Admin. Extracted so the rule has one home instead of being
// verified twice — a non-Admin target is never the last Admin, so this is false for one without
// even counting.
export function isLastAdmin(userId: string, users: readonly User[]): boolean {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user || !user.isAdmin) return false;

  const adminCount = users.filter((candidate) => candidate.isAdmin).length;
  return adminCount <= 1;
}
