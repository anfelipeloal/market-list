import type { Category } from "./entities";
import { cleanDisplayName, findOtherWithMatchingName, normalizeName } from "./names";

export type RenameCategoryResult =
  | { outcome: "notFound" }
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingCategory: Category }
  | { outcome: "valid"; id: string; name: string; normalizedName: string };

// Validates renaming an existing Category. Renaming to a variant of its own name (capitalization,
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

  const name = cleanDisplayName(rawName);
  if (name === "") return { outcome: "empty" };

  const existingCategory = findOtherWithMatchingName(existingCategories, categoryId, name);
  if (existingCategory) return { outcome: "duplicate", existingCategory };

  return { outcome: "valid", id: categoryId, name, normalizedName: normalizeName(name) };
}
