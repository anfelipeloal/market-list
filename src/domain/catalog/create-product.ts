import type { Category } from "./entities";
import { checkProductName } from "./product-name";
import type { ProductWithStatus } from "../shopping/status";

export type CreateProductResult =
  | { outcome: "empty" }
  | { outcome: "unknownCategory" }
  | { outcome: "duplicate"; existingProduct: ProductWithStatus; existingCategory: Category }
  | { outcome: "valid"; name: string; normalizedName: string; categoryId: string };

// Validates a new Product name and its chosen Category against the Household's existing Products
// and Categories, sharing its core name check with validateProductRename (see checkProductName in
// ./product-name; creating passes null since there is no Product yet to exclude). A Product's
// name must be unique across every Category, not just its own (see CONTEXT.md). The duplicate
// outcome carries the existing Product's status so the caller can offer to move it to the
// Shopping List when it is still in the Pantry, or say it is already on the Shopping List
// otherwise (see CONTEXT.md and src/domain/shopping/status.ts). Does not touch the database: the
// caller re-checks the unique constraint on insert as the final guard against a concurrent create
// winning the same name (see src/db/products.ts).
export function validateNewProduct(
  rawName: string,
  categoryId: string,
  existingProducts: readonly ProductWithStatus[],
  existingCategories: readonly Category[],
): CreateProductResult {
  const result = checkProductName(rawName, existingProducts, existingCategories, null);
  if (result.outcome === "empty") return result;

  const category = existingCategories.find((candidate) => candidate.id === categoryId);
  if (!category) return { outcome: "unknownCategory" };

  if (result.outcome === "duplicate") return result;
  return { ...result, categoryId };
}
