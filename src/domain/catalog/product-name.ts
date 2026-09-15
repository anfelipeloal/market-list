import type { Category, Product } from "./entities";
import { checkNameCollision } from "./names";

export type ProductNameCheckResult =
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingProduct: Product; existingCategory: Category }
  | { outcome: "valid"; name: string; normalizedName: string };

// Core name validation shared by creating and renaming a Product: clean the raw name, reject an
// empty result, then reject a collision with another Product regardless of Category (see
// CONTEXT.md — a Product's name is unique across all Categories, not just its own), resolving the
// Category of the Product it collides with. `excludeId` is the Product being renamed, excluded
// from its own collision check; creating passes null since there is no Product yet to exclude.
export function checkProductName(
  rawName: string,
  existingProducts: readonly Product[],
  existingCategories: readonly Category[],
  excludeId: string | null,
): ProductNameCheckResult {
  const result = checkNameCollision(rawName, existingProducts, excludeId);
  if (result.outcome !== "duplicate") return result;

  const existingCategory = existingCategories.find((candidate) => candidate.id === result.existing.categoryId);
  if (!existingCategory) {
    // Every Product's Category is a foreign key (on delete restrict), so this only happens if the
    // caller forgot to pass the full list of Categories alongside the Products.
    throw new Error(`Product "${result.existing.name}" references a Category that was not provided`);
  }
  return { outcome: "duplicate", existingProduct: result.existing, existingCategory };
}
