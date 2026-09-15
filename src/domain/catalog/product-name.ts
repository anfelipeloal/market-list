import type { Category, Product } from "./entities";
import { checkNameCollision } from "./names";

export type ProductNameCheckResult<T extends Product> =
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingProduct: T; existingCategory: Category }
  | { outcome: "valid"; name: string; normalizedName: string };

// Core name validation shared by creating and renaming a Product: clean the raw name, reject an
// empty result, then reject a collision with another Product regardless of Category (see
// CONTEXT.md — a Product's name is unique across all Categories, not just its own), resolving the
// Category of the Product it collides with. `excludeId` is the Product being renamed, excluded
// from its own collision check; creating passes null since there is no Product yet to exclude.
// Generic in T so a caller can pass richer Product rows (e.g. validateNewProduct passes ones with
// a `status`, so its duplicate result can tell the UI where the existing Product stands — see
// src/domain/shopping/status.ts) without this shared check needing to know about that field.
export function checkProductName<T extends Product>(
  rawName: string,
  existingProducts: readonly T[],
  existingCategories: readonly Category[],
  excludeId: string | null,
): ProductNameCheckResult<T> {
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
