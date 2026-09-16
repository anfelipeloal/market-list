import { describe, expect, it } from "vitest";
import { buildShoppingListMarkdown } from "./shopping-list-markdown";
import type { ShoppingListCategory } from "./shopping-list";

describe("the Shopping List markdown export", () => {
  it("renders a heading per Category and a checkbox line per Product still needed", () => {
    const shoppingList: ShoppingListCategory[] = [
      {
        id: "cat-frutas",
        name: "Frutas",
        products: [{ id: "prod-banano", name: "Bananos", inCart: false }],
      },
      {
        id: "cat-lacteos",
        name: "Lácteos y huevos",
        products: [
          { id: "prod-leche", name: "Leche", inCart: false },
          { id: "prod-queso", name: "Queso", inCart: false },
        ],
      },
    ];

    expect(buildShoppingListMarkdown(shoppingList)).toBe(
      "## Frutas\n- [ ] Bananos\n\n## Lácteos y huevos\n- [ ] Leche\n- [ ] Queso",
    );
  });

  it("keeps the Categories and Products in the order the Shopping List view gives them (A-Z)", () => {
    const shoppingList: ShoppingListCategory[] = [
      {
        id: "cat-frutas",
        name: "Frutas",
        products: [
          { id: "prod-manzana", name: "Manzana", inCart: false },
          { id: "prod-uva", name: "Uva", inCart: false },
        ],
      },
      {
        id: "cat-verduras",
        name: "Verduras",
        products: [{ id: "prod-zanahoria", name: "Zanahoria", inCart: false }],
      },
    ];

    expect(buildShoppingListMarkdown(shoppingList)).toBe(
      "## Frutas\n- [ ] Manzana\n- [ ] Uva\n\n## Verduras\n- [ ] Zanahoria",
    );
  });

  it("excludes In Cart Products from the checklist", () => {
    const shoppingList: ShoppingListCategory[] = [
      {
        id: "cat-verduras",
        name: "Verduras",
        products: [
          { id: "prod-acelga", name: "Acelga", inCart: false },
          { id: "prod-berenjena", name: "Berenjena", inCart: true },
        ],
      },
    ];

    expect(buildShoppingListMarkdown(shoppingList)).toBe("## Verduras\n- [ ] Acelga");
  });

  it("omits a Category whose Products are all In Cart", () => {
    const shoppingList: ShoppingListCategory[] = [
      {
        id: "cat-frutas",
        name: "Frutas",
        products: [{ id: "prod-manzana", name: "Manzana", inCart: true }],
      },
      {
        id: "cat-verduras",
        name: "Verduras",
        products: [{ id: "prod-acelga", name: "Acelga", inCart: false }],
      },
    ];

    expect(buildShoppingListMarkdown(shoppingList)).toBe("## Verduras\n- [ ] Acelga");
  });

  it("returns an empty string when there is nothing left to buy", () => {
    const allInCart: ShoppingListCategory[] = [
      {
        id: "cat-frutas",
        name: "Frutas",
        products: [{ id: "prod-manzana", name: "Manzana", inCart: true }],
      },
    ];

    expect(buildShoppingListMarkdown(allInCart)).toBe("");
    expect(buildShoppingListMarkdown([])).toBe("");
  });

  it("keeps accents and capitalization exactly as stored, without escaping markdown characters", () => {
    const shoppingList: ShoppingListCategory[] = [
      {
        id: "cat-condimentos",
        name: "Condimentos & Salsas",
        products: [{ id: "prod-aji", name: "Ají *picante*", inCart: false }],
      },
    ];

    expect(buildShoppingListMarkdown(shoppingList)).toBe(
      "## Condimentos & Salsas\n- [ ] Ají *picante*",
    );
  });
});
