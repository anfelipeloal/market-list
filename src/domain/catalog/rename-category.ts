import type { Category } from "./entities";
import { checkNameCollision } from "./names";

export type RenameCategoryResult =
  | { outcome: "notFound" }
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingCategory: Category }
  | { outcome: "valid"; id: string; name: string; normalizedName: string };

// Validates renaming an existing Category, sharing its core name check with validateNewCategory
// (see checkNameCollision in ./names). Renaming to a variant of its own name (capitalization,
// accents, spacing) is allowed and updates the display name: the duplicate check excludes the
// Category being renamed, so it never collides with itself. Does not touch the database: the
// caller re-checks the unique constraint on update as the final guard against a concurrent rename
// winning the same name (see src/db/categories.ts and src/app/actions.ts).
export function validateCategoryRename(
  categoryId: string,
  rawName: string,
  existingCategories: readonly Category[],
): RenameCategoryResult {
  const category = existingCategories.find((candidate) => candidate.id === categoryId);
  if (!category) return { outcome: "notFound" };

  const result = checkNameCollision(rawName, existingCategories, categoryId);
  if (result.outcome === "duplicate") return { outcome: "duplicate", existingCategory: result.existing };
  if (result.outcome === "empty") return result;
  return { outcome: "valid", id: categoryId, name: result.name, normalizedName: result.normalizedName };
}
