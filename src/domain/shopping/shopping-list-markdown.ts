import type { ShoppingListCategory } from "./shopping-list";

// Renders the Shopping List view as a markdown checklist to paste into a chat (ticket #11): one
// "## {Category}" heading per Category that still has something needed, followed by one
// "- [ ] {Product}" line per Product still needed. `shoppingList` already carries Categories and
// Products A-Z (buildShoppingListView), so this only filters — it never re-sorts. In Cart
// Products are left off the checklist, and a Category left with none (all In Cart, or none to
// begin with) is dropped entirely rather than printed as an empty heading. Names are written
// exactly as stored: no escaping, no case changes. Sections are joined by a single blank line,
// with no leading or trailing blank line, so the result can be copied as-is; when nothing is left
// to buy the result is "" and the caller decides what that means for the User.
export function buildShoppingListMarkdown(shoppingList: readonly ShoppingListCategory[]): string {
  return shoppingList
    .map((category) => {
      const needed = category.products.filter((product) => !product.inCart);
      if (needed.length === 0) return null;

      const lines = needed.map((product) => `- [ ] ${product.name}`);
      return [`## ${category.name}`, ...lines].join("\n");
    })
    .filter((section): section is string => section !== null)
    .join("\n\n");
}
