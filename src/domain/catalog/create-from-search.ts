import { namesMatch, normalizeName, sortByName } from "./names";
import type { PantryCategory } from "./pantry";

// Whether the Despensa search should offer to create a Product named like the search text: not for
// empty text, and not when a visible Pantry Product already has exactly that name under the app's
// name matching (capitalization, accents and extra spaces ignored; plurals and ñ distinct).
export function shouldOfferCreate(searchText: string, visiblePantry: readonly PantryCategory[]): boolean {
  if (searchText.trim() === "") return false;
  return !visiblePantry.some((category) => category.products.some((product) => namesMatch(product.name, searchText)));
}

// The Category to preselect for the new Product. First choice: the filtered results (Products
// whose name contains the search text). When there are none — typically because the User typed a
// longer name than any existing Product, like "Leche deslactosada" next to "Leche" — fall back to
// the Products whose every word appears in the search text. Whole words only, so "salsa" never
// suggests the Category of "Sal". Either way the Category with the most matches wins, ties go to
// the first A-Z, and no matches means no suggestion.
export function suggestCategoryId(
  filtered: readonly PantryCategory[],
  pantry: readonly PantryCategory[],
  searchText: string,
): string | undefined {
  return categoryWithMostProducts(filtered) ?? categoryWithMostProducts(productsNamedWithin(pantry, searchText));
}

function categoryWithMostProducts(categories: readonly PantryCategory[]): string | undefined {
  let best: PantryCategory | undefined;
  for (const category of sortByName(categories)) {
    if (category.products.length === 0) continue;
    if (!best || category.products.length > best.products.length) best = category;
  }
  return best?.id;
}

function productsNamedWithin(pantry: readonly PantryCategory[], searchText: string): PantryCategory[] {
  const searchWords = new Set(words(searchText));
  return pantry.map((category) => ({
    ...category,
    products: category.products.filter((product) => words(product.name).every((word) => searchWords.has(word))),
  }));
}

function words(text: string): string[] {
  return normalizeName(text).split(" ").filter((word) => word !== "");
}
