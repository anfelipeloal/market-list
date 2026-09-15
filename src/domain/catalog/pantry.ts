import type { Category, Product } from "./entities";
import { sortByName } from "./names";

export interface PantryCategory {
  id: string;
  name: string;
  products: Array<{ id: string; name: string }>;
}

// The Pantry view: every Category A-Z, including ones with no Products yet so a User can add to
// them, each with its own Products A-Z.
export function buildPantryView(categories: readonly Category[], products: readonly Product[]): PantryCategory[] {
  return sortByName(categories).map((category) => ({
    id: category.id,
    name: category.name,
    products: sortByName(products.filter((product) => product.categoryId === category.id)).map((product) => ({
      id: product.id,
      name: product.name,
    })),
  }));
}
