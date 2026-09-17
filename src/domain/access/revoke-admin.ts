import type { User } from "./entities";

export type RevokeAdminResult = { outcome: "notFound" } | { outcome: "lastAdmin" } | { outcome: "allowed"; user: User };

// Validates revoking the Admin role from a User (ticket #14): refuses when the target is the
// Household's only Admin, so the Household is never left without one — exactly the same invariant
// and check as validateUserRemoval (src/domain/access/remove-user.ts), which this mirrors on
// purpose (see that module's own comment and CONTEXT.md — "A Household always has at least one
// Admin"). Revoking a non-Admin, or an Admin while another Admin remains, is allowed. Does not
// touch the database or end any Session: unlike Change PIN or removing a User, revoking the Admin
// role never ends Sessions (see CONTEXT.md and src/app/(app)/usuarios/actions.ts#revokeAdmin).
export function validateRevokeAdmin(existingUsers: readonly User[], userId: string): RevokeAdminResult {
  const user = existingUsers.find((candidate) => candidate.id === userId);
  if (!user) return { outcome: "notFound" };

  if (user.isAdmin) {
    const adminCount = existingUsers.filter((candidate) => candidate.isAdmin).length;
    if (adminCount <= 1) return { outcome: "lastAdmin" };
  }

  return { outcome: "allowed", user };
}
