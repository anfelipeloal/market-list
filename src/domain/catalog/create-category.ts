import type { Category } from "./entities";
import { checkNameCollision } from "./names";

export type CreateCategoryResult =
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingCategory: Category }
  | { outcome: "valid"; name: string; normalizedName: string };

// Validates a new Category name against the Household's existing Categories, sharing its core
// name check with validateCategoryRename (see checkNameCollision in ./names; creating passes null
// since there is no Category yet to exclude from the collision check). Does not touch the
// database: the caller re-checks the unique constraint on insert as the final guard against a
// concurrent create winning the same name (see src/db/categories.ts).
export function validateNewCategory(rawName: string, existingCategories: readonly Category[]): CreateCategoryResult {
  const result = checkNameCollision(rawName, existingCategories, null);
  return result.outcome === "duplicate" ? { outcome: "duplicate", existingCategory: result.existing } : result;
}
