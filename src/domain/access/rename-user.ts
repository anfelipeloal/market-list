import { checkNameCollision } from "@/domain/catalog/names";
import type { User } from "./entities";

export type RenameUserResult =
  | { outcome: "notFound" }
  | { outcome: "emptyName" }
  | { outcome: "duplicateName"; existingUser: User }
  | { outcome: "valid"; id: string; name: string; normalizedName: string };

// Validates renaming an existing User, sharing its core name check with validateNewUser (see
// checkNameCollision in src/domain/catalog/names.ts). Renaming to a variant of its own name
// (capitalization, accents, spacing) is allowed and updates the display name: the duplicate check
// excludes the User being renamed, exactly like a Category or Product rename (see
// src/domain/catalog/rename-category.ts). Changing a User's PIN or Admin role is out of scope for
// this ticket (#14); only the name changes here.
export function validateUserRename(userId: string, rawName: string, existingUsers: readonly User[]): RenameUserResult {
  const user = existingUsers.find((candidate) => candidate.id === userId);
  if (!user) return { outcome: "notFound" };

  const result = checkNameCollision(rawName, existingUsers, userId);
  if (result.outcome === "duplicate") return { outcome: "duplicateName", existingUser: result.existing };
  if (result.outcome === "empty") return { outcome: "emptyName" };
  return { outcome: "valid", id: userId, name: result.name, normalizedName: result.normalizedName };
}
