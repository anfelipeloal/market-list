import type { Category, Product } from "./entities";
import { cleanDisplayName, namesMatch, normalizeName } from "./names";

export type CreateProductResult =
  | { outcome: "empty" }
  | { outcome: "unknownCategory" }
  | { outcome: "duplicate"; existingProduct: Product; existingCategory: Category }
  | { outcome: "valid"; name: string; normalizedName: string; categoryId: string };

// Validates a new Product name and its chosen Category against the Household's existing Products
// and Categories. A Product's name must be unique across every Category, not just its own (see
// CONTEXT.md). Does not touch the database: the caller re-checks the unique constraint on insert
// as the final guard against a concurrent create winning the same name (see src/db/products.ts).
export function validateNewProduct(
  rawName: string,
  categoryId: string,
  existingProducts: readonly Product[],
  existingCategories: readonly Category[],
): CreateProductResult {
  const name = cleanDisplayName(rawName);
  if (name === "") return { outcome: "empty" };

  const category = existingCategories.find((candidate) => candidate.id === categoryId);
  if (!category) return { outcome: "unknownCategory" };

  const existingProduct = existingProducts.find((product) => namesMatch(product.name, name));
  if (existingProduct) {
    const existingCategory = existingCategories.find((candidate) => candidate.id === existingProduct.categoryId);
    if (!existingCategory) {
      // Every Product's Category is a foreign key (on delete restrict), so this only happens if
      // the caller forgot to pass the full list of Categories alongside the Products.
      throw new Error(`Product "${existingProduct.name}" references a Category that was not provided`);
    }
    return { outcome: "duplicate", existingProduct, existingCategory };
  }

  return { outcome: "valid", name, normalizedName: normalizeName(name), categoryId };
}
