import type { User } from "./entities";
import { isValidPin } from "./pin";

export type ChangePinResult =
  | { outcome: "notFound" }
  | { outcome: "invalidPin" }
  | { outcome: "valid"; userId: string; pin: string };

// Validates changing a User's PIN (ticket #14): an Admin may change any User's PIN, including
// their own (CONTEXT.md's Change PIN), so the only shape check here is that the target User
// exists among the Household's Users — exactly like validateUserRename's notFound guard
// (src/domain/access/rename-user.ts) — and that the new PIN is exactly 4 digits (isValidPin, see
// src/domain/access/pin.ts). The PIN's own uniqueness is NOT checked here, for the same reason
// validateNewUser never checks it (src/domain/access/create-user.ts): the domain core has no
// access to PIN_HASH_SECRET and so can never compute the keyed hash a stored PIN would collide
// on. That half of the rule is only enforced by the database's unique index on pin_hash; the
// caller maps a unique violation on that index to a "duplicatePin" outcome of its own (see
// src/db/users.ts#updateUserPin and src/app/(app)/usuarios/actions.ts#changePin).
//
// Parameter order is (existingUsers, userId, pin) — the same order every Access validator that
// targets an existing User uses (validateUserRemoval, validateUserRename, validateGrantAdmin,
// validateRevokeAdmin): current state first, then the target, then any new data.
export function validatePinChange(existingUsers: readonly User[], userId: string, pin: string): ChangePinResult {
  const user = existingUsers.find((candidate) => candidate.id === userId);
  if (!user) return { outcome: "notFound" };

  if (!isValidPin(pin)) return { outcome: "invalidPin" };

  return { outcome: "valid", userId, pin };
}
