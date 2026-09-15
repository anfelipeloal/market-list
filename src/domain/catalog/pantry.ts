import type { Category } from "./entities";
import { sortByName } from "./names";
import type { ProductWithStatus } from "../shopping/status";

export interface PantryCategory {
  id: string;
  name: string;
  products: Array<{ id: string; name: string }>;
}

// The Pantry view: every Category A-Z, including ones with no Pantry Products yet so a User can
// add to them, each with only its Products still in the Pantry (status "pantry"), A-Z. A Product
// moved to the Shopping List (ticket #9) or beyond no longer appears here.
export function buildPantryView(
  categories: readonly Category[],
  products: readonly ProductWithStatus[],
): PantryCategory[] {
  return sortByName(categories).map((category) => ({
    id: category.id,
    name: category.name,
    products: sortByName(
      products.filter((product) => product.categoryId === category.id && product.status === "pantry"),
    ).map((product) => ({
      id: product.id,
      name: product.name,
    })),
  }));
}
