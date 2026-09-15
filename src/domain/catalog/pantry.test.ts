import { describe, expect, it } from "vitest";
import { buildPantryView } from "./pantry";

describe("the Pantry view", () => {
  it("lists Categories A-Z, each with its Pantry Products A-Z", () => {
    const categories = [
      { id: "cat-verduras", name: "Verduras" },
      { id: "cat-frutas", name: "Frutas" },
    ];
    const products = [
      { id: "prod-zanahoria", name: "Zanahoria", categoryId: "cat-verduras", status: "pantry" as const },
      { id: "prod-manzana", name: "Manzana", categoryId: "cat-frutas", status: "pantry" as const },
      { id: "prod-acelga", name: "Acelga", categoryId: "cat-verduras", status: "pantry" as const },
      { id: "prod-limon", name: "Limón", categoryId: "cat-frutas", status: "pantry" as const },
    ];

    expect(buildPantryView(categories, products)).toEqual([
      {
        id: "cat-frutas",
        name: "Frutas",
        products: [
          { id: "prod-limon", name: "Limón" },
          { id: "prod-manzana", name: "Manzana" },
        ],
      },
      {
        id: "cat-verduras",
        name: "Verduras",
        products: [
          { id: "prod-acelga", name: "Acelga" },
          { id: "prod-zanahoria", name: "Zanahoria" },
        ],
      },
    ]);
  });

  it("includes a Category with no Pantry Products, so a User can add to it", () => {
    const categories = [{ id: "cat-aseo", name: "Aseo" }];

    expect(buildPantryView(categories, [])).toEqual([{ id: "cat-aseo", name: "Aseo", products: [] }]);
  });

  it("excludes a Product that moved to the Shopping List", () => {
    const categories = [{ id: "cat-frutas", name: "Frutas" }];
    const products = [{ id: "prod-manzana", name: "Manzana", categoryId: "cat-frutas", status: "shopping_list" as const }];

    expect(buildPantryView(categories, products)).toEqual([{ id: "cat-frutas", name: "Frutas", products: [] }]);
  });

  it("excludes a Product that is In Cart", () => {
    const categories = [{ id: "cat-frutas", name: "Frutas" }];
    const products = [{ id: "prod-manzana", name: "Manzana", categoryId: "cat-frutas", status: "in_cart" as const }];

    expect(buildPantryView(categories, products)).toEqual([{ id: "cat-frutas", name: "Frutas", products: [] }]);
  });
});
