import type { Category } from "../catalog/entities";
import { sortByName } from "../catalog/names";
import type { ProductWithStatus } from "./status";

export interface ShoppingListCategory {
  id: string;
  name: string;
  products: Array<{ id: string; name: string; inCart: boolean }>;
}

// The Shopping List view: Products on the Shopping List (status "shopping_list") or In Cart
// (status "in_cart") grouped by Category A-Z. Within a Category, Products still needed come
// first A-Z, then In Cart Products A-Z at the bottom (ticket #10): sorting the two groups
// separately and concatenating keeps that split independent of the input order. Unlike the
// Pantry view, a Category with none of these Products is omitted entirely: there is nothing for a
// User to do with it here.
export function buildShoppingListView(
  categories: readonly Category[],
  products: readonly ProductWithStatus[],
): ShoppingListCategory[] {
  return sortByName(categories)
    .map((category) => {
      const inCategory = products.filter((product) => product.categoryId === category.id);
      const needed = sortByName(inCategory.filter((product) => product.status === "shopping_list"));
      const inCart = sortByName(inCategory.filter((product) => product.status === "in_cart"));

      return {
        id: category.id,
        name: category.name,
        products: [...needed, ...inCart].map((product) => ({
          id: product.id,
          name: product.name,
          inCart: product.status === "in_cart",
        })),
      };
    })
    .filter((category) => category.products.length > 0);
}
