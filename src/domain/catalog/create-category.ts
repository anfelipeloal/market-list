import type { Category } from "./entities";
import { cleanDisplayName, namesMatch, normalizeName } from "./names";

export type CreateCategoryResult =
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingCategory: Category }
  | { outcome: "valid"; name: string; normalizedName: string };

// Validates a new Category name against the Household's existing Categories. Does not touch the
// database: the caller re-checks the unique constraint on insert as the final guard against a
// concurrent create winning the same name (see src/db/categories.ts).
export function validateNewCategory(rawName: string, existingCategories: readonly Category[]): CreateCategoryResult {
  const name = cleanDisplayName(rawName);
  if (name === "") return { outcome: "empty" };

  const existingCategory = existingCategories.find((category) => namesMatch(category.name, name));
  if (existingCategory) return { outcome: "duplicate", existingCategory };

  return { outcome: "valid", name, normalizedName: normalizeName(name) };
}
