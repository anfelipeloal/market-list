import type { ProductWithStatus } from "../shopping/status";
import type { Category } from "./entities";

export type DeleteCategoryResult =
  | { outcome: "notFound" }
  | { outcome: "hasProducts" }
  | { outcome: "allowed"; category: Category };

// Validates deleting a Category (ticket #15): refused when the Category still has any Product,
// whatever that Product's status (Pantry, Shopping List or In Cart — CONTEXT.md's "What to build"
// is explicit that a Category is never deleted along with its Products), so an Admin always
// deletes the Category's Products first. An empty Category may always be deleted. Mirrors the
// database's own products.categoryId "on delete restrict" constraint (src/db/schema.ts), which is
// the final backstop if a Product is created in this Category between this check and the delete
// (see src/db/pg-errors.ts#isForeignKeyViolation). Does not touch the database.
export function validateCategoryDeletion(
  categoryId: string,
  existingCategories: readonly Category[],
  existingProducts: readonly ProductWithStatus[],
): DeleteCategoryResult {
  const category = existingCategories.find((candidate) => candidate.id === categoryId);
  if (!category) return { outcome: "notFound" };

  const hasProducts = existingProducts.some((product) => product.categoryId === categoryId);
  if (hasProducts) return { outcome: "hasProducts" };

  return { outcome: "allowed", category };
}
