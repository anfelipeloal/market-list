import { checkNameCollision } from "@/domain/catalog/names";
import type { User } from "./entities";
import { isValidPin } from "./pin";

export type CreateUserResult =
  | { outcome: "emptyName" }
  | { outcome: "duplicateName"; existingUser: User }
  | { outcome: "invalidPin" }
  | { outcome: "valid"; name: string; normalizedName: string; pin: string };

// Validates a new User's name and PIN against the Household's existing Users (ticket #13). Name
// matching and cleaning are shared with the Catalog (checkNameCollision, see
// src/domain/catalog/names.ts): User names use the same rule as Category and Product names
// (CONTEXT.md). The PIN's own uniqueness is NOT checked here: the domain core has no access to
// PIN_HASH_SECRET (see src/lib/pin-hash.ts) and so can never compute the keyed hash a stored PIN
// would collide on. That half of the rule is only enforced by the database's unique index on
// pin_hash; the caller maps a unique violation on that index to a "duplicatePin" outcome of its
// own (see src/db/users.ts, insertUserOrDuplicate, and src/app/(app)/usuarios/actions.ts).
export function validateNewUser(rawName: string, pin: string, existingUsers: readonly User[]): CreateUserResult {
  const nameResult = checkNameCollision(rawName, existingUsers, null);
  if (nameResult.outcome === "empty") return { outcome: "emptyName" };
  if (nameResult.outcome === "duplicate") return { outcome: "duplicateName", existingUser: nameResult.existing };

  if (!isValidPin(pin)) return { outcome: "invalidPin" };

  return { outcome: "valid", name: nameResult.name, normalizedName: nameResult.normalizedName, pin };
}
