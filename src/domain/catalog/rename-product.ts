import type { Category, Product } from "./entities";
import { checkProductName } from "./product-name";

export type RenameProductResult =
  | { outcome: "notFound" }
  | { outcome: "empty" }
  | { outcome: "duplicate"; existingProduct: Product; existingCategory: Category }
  | { outcome: "valid"; id: string; name: string; normalizedName: string };

// Validates renaming an existing Product, sharing its core name check with validateNewProduct
// (see checkProductName in ./product-name). A Product's name must stay unique across every
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

  const result = checkProductName(rawName, existingProducts, existingCategories, productId);
  if (result.outcome === "valid") return { ...result, id: productId };
  return result;
}
