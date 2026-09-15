import type { Category, Product } from "./entities";
import { cleanDisplayName, findOtherWithMatchingName, normalizeName } from "./names";

export type RenameProductResult =
  | { outcome: "notFound" }
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingProduct: Product; existingCategory: Category }
  | { outcome: "valid"; id: string; name: string; normalizedName: string };

// Validates renaming an existing Product. A Product's name must stay unique across every
// Category, not just its own (see CONTEXT.md), so the collision check spans every OTHER Product
// regardless of Category. Renaming to a variant of its own name is allowed, the same as for a
// Category. Does not touch the database: the caller re-checks the unique constraint on update as
// the final guard against a concurrent rename winning the same name (see src/db/products.ts and
// src/app/actions.ts).
export function validateProductRename(
  productId: string,
  rawName: string,
  existingProducts: readonly Product[],
  existingCategories: readonly Category[],
): RenameProductResult {
  const product = existingProducts.find((candidate) => candidate.id === productId);
  if (!product) return { outcome: "notFound" };

  const name = cleanDisplayName(rawName);
  if (name === "") return { outcome: "empty" };

  const existingProduct = findOtherWithMatchingName(existingProducts, productId, name);
  if (existingProduct) {
    const existingCategory = existingCategories.find((candidate) => candidate.id === existingProduct.categoryId);
    if (!existingCategory) {
      // Every Product's Category is a foreign key (on delete restrict), so this only happens if
      // the caller forgot to pass the full list of Categories alongside the Products.
      throw new Error(`Product "${existingProduct.name}" references a Category that was not provided`);
    }
    return { outcome: "duplicate", existingProduct, existingCategory };
  }

  return { outcome: "valid", id: productId, name, normalizedName: normalizeName(name) };
}
