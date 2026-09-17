import type { ProductWithStatus } from "../shopping/status";

export type DeleteProductResult = { outcome: "notFound" } | { outcome: "allowed"; product: ProductWithStatus };

// Validates deleting a Product (ticket #15): allowed from any status — Pantry, Shopping List or
// In Cart (see CONTEXT.md) — since deleting removes the Product wherever it currently is, and
// there is no other rule to check (unlike deleting a Category, see ./delete-category.ts). The only
// way this can be refused is an unknown Product id. Does not touch the database.
export function validateProductDeletion(
  productId: string,
  existingProducts: readonly ProductWithStatus[],
): DeleteProductResult {
  const product = existingProducts.find((candidate) => candidate.id === productId);
  if (!product) return { outcome: "notFound" };

  return { outcome: "allowed", product };
}
