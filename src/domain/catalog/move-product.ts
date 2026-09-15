import type { Category, Product } from "./entities";

export type MoveProductResult =
  | { outcome: "productNotFound" }
  | { outcome: "categoryNotFound" }
  | { outcome: "valid"; id: string; categoryId: string };

// Validates moving an existing Product to a different Category. Moving a Product to the Category
// it is already in is allowed and changes nothing: there is no rule against it, so the caller can
// always submit the current Category without a special case. Does not touch the database.
export function validateProductMove(
  productId: string,
  categoryId: string,
  existingProducts: readonly Product[],
  existingCategories: readonly Category[],
): MoveProductResult {
  const product = existingProducts.find((candidate) => candidate.id === productId);
  if (!product) return { outcome: "productNotFound" };

  const category = existingCategories.find((candidate) => candidate.id === categoryId);
  if (!category) return { outcome: "categoryNotFound" };

  return { outcome: "valid", id: productId, categoryId };
}
