import { normalizeName } from "./names";
import type { PantryCategory } from "./pantry";

// Filters the Pantry view down to Products whose name contains the search text, comparing with
// `normalizeName` on both sides so capitalization, accents and extra spaces are ignored, the same
// as name matching. Search text that is empty or whitespace-only returns the Pantry unchanged.
// Categories left with no matching Products (including ones with no Products at all) are hidden;
// the A-Z order Categories and Products arrive in is preserved.
export function searchPantry(pantry: readonly PantryCategory[], searchText: string): PantryCategory[] {
  const normalizedSearch = normalizeName(searchText);
  if (normalizedSearch === "") return [...pantry];

  return pantry
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => normalizeName(product.name).includes(normalizedSearch)),
    }))
    .filter((category) => category.products.length > 0);
}
