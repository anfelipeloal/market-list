import { namesMatch, sortByName } from "./names";
import type { PantryCategory } from "./pantry";

// Whether the Despensa search should offer to create a Product named like the search text: not for
// empty text, and not when a visible Pantry Product already has exactly that name under the app's
// name matching (capitalization, accents and extra spaces ignored; plurals and ñ distinct).
export function shouldOfferCreate(searchText: string, visiblePantry: readonly PantryCategory[]): boolean {
  if (searchText.trim() === "") return false;
  return !visiblePantry.some((category) => category.products.some((product) => namesMatch(product.name, searchText)));
}

// The Category to preselect for the new Product, from the filtered Pantry view: the one holding the
// most matches; ties go to the first A-Z; no matches means no suggestion.
export function suggestCategoryId(filtered: readonly PantryCategory[]): string | undefined {
  let best: PantryCategory | undefined;
  for (const category of sortByName(filtered)) {
    if (category.products.length === 0) continue;
    if (!best || category.products.length > best.products.length) best = category;
  }
  return best?.id;
}
