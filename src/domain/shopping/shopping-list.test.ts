import { describe, expect, it } from "vitest";
import { buildShoppingListView } from "./shopping-list";

const categories = [
  { id: "cat-verduras", name: "Verduras" },
  { id: "cat-frutas", name: "Frutas" },
];

describe("the Shopping List view", () => {
  it("lists Categories A-Z, each with its Shopping List Products A-Z", () => {
    const products = [
      { id: "prod-zanahoria", name: "Zanahoria", categoryId: "cat-verduras", status: "shopping_list" as const },
      { id: "prod-manzana", name: "Manzana", categoryId: "cat-frutas", status: "shopping_list" as const },
      { id: "prod-acelga", name: "Acelga", categoryId: "cat-verduras", status: "shopping_list" as const },
    ];

    expect(buildShoppingListView(categories, products)).toEqual([
      { id: "cat-frutas", name: "Frutas", products: [{ id: "prod-manzana", name: "Manzana", inCart: false }] },
      {
        id: "cat-verduras",
        name: "Verduras",
        products: [
          { id: "prod-acelga", name: "Acelga", inCart: false },
          { id: "prod-zanahoria", name: "Zanahoria", inCart: false },
        ],
      },
    ]);
  });

  it("includes In Cart Products alongside Shopping List ones", () => {
    const products = [{ id: "prod-leche", name: "Leche", categoryId: "cat-frutas", status: "in_cart" as const }];

    expect(buildShoppingListView(categories, products)).toEqual([
      { id: "cat-frutas", name: "Frutas", products: [{ id: "prod-leche", name: "Leche", inCart: true }] },
    ]);
  });

  it("lists Products still needed before In Cart Products within a Category, each A-Z", () => {
    const products = [
      { id: "prod-zanahoria", name: "Zanahoria", categoryId: "cat-verduras", status: "in_cart" as const },
      { id: "prod-acelga", name: "Acelga", categoryId: "cat-verduras", status: "shopping_list" as const },
      { id: "prod-berenjena", name: "Berenjena", categoryId: "cat-verduras", status: "in_cart" as const },
      { id: "prod-cebolla", name: "Cebolla", categoryId: "cat-verduras", status: "shopping_list" as const },
    ];

    expect(buildShoppingListView(categories, products)).toEqual([
      {
        id: "cat-verduras",
        name: "Verduras",
        products: [
          { id: "prod-acelga", name: "Acelga", inCart: false },
          { id: "prod-cebolla", name: "Cebolla", inCart: false },
          { id: "prod-berenjena", name: "Berenjena", inCart: true },
          { id: "prod-zanahoria", name: "Zanahoria", inCart: true },
        ],
      },
    ]);
  });

  it("omits a Category that has no Shopping List or In Cart Products, unlike the Pantry view", () => {
    const products = [{ id: "prod-acelga", name: "Acelga", categoryId: "cat-verduras", status: "shopping_list" as const }];

    expect(buildShoppingListView(categories, products)).toEqual([
      { id: "cat-verduras", name: "Verduras", products: [{ id: "prod-acelga", name: "Acelga", inCart: false }] },
    ]);
  });

  it("excludes Products still in the Pantry", () => {
    const products = [{ id: "prod-acelga", name: "Acelga", categoryId: "cat-verduras", status: "pantry" as const }];

    expect(buildShoppingListView(categories, products)).toEqual([]);
  });

  it("returns no Categories when nothing is on the Shopping List", () => {
    expect(buildShoppingListView(categories, [])).toEqual([]);
  });
});
