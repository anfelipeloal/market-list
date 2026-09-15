import type { Category } from "../catalog/entities";
import { sortByName } from "../catalog/names";
import type { ProductWithStatus } from "./status";

export interface ShoppingListCategory {
  id: string;
  name: string;
  products: Array<{ id: string; name: string }>;
}

// The Shopping List view: Products on the Shopping List (status "shopping_list") or In Cart
// (status "in_cart", ticket #10) grouped by Category A-Z, each with its own Products A-Z. Unlike
// the Pantry view, a Category with none of these Products is omitted entirely: there is nothing
// for a User to do with it here. In Cart ordering within a Category beyond A-Z is ticket #10.
export function buildShoppingListView(
  categories: readonly Category[],
  products: readonly ProductWithStatus[],
): ShoppingListCategory[] {
  return sortByName(categories)
    .map((category) => ({
      id: category.id,
      name: category.name,
      products: sortByName(
        products.filter(
          (product) =>
            product.categoryId === category.id &&
            (product.status === "shopping_list" || product.status === "in_cart"),
        ),
      ).map((product) => ({ id: product.id, name: product.name })),
    }))
    .filter((category) => category.products.length > 0);
}
