import { describe, expect, it } from "vitest";
import { buildPantryView } from "./pantry";

describe("the Pantry view", () => {
  it("lists Categories A-Z, each with its Products A-Z", () => {
    const categories = [
      { id: "cat-verduras", name: "Verduras" },
      { id: "cat-frutas", name: "Frutas" },
    ];
    const products = [
      { id: "prod-zanahoria", name: "Zanahoria", categoryId: "cat-verduras" },
      { id: "prod-manzana", name: "Manzana", categoryId: "cat-frutas" },
      { id: "prod-acelga", name: "Acelga", categoryId: "cat-verduras" },
      { id: "prod-limon", name: "Limón", categoryId: "cat-frutas" },
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

  it("includes a Category with no Products, so a User can add to it", () => {
    const categories = [{ id: "cat-aseo", name: "Aseo" }];

    expect(buildPantryView(categories, [])).toEqual([{ id: "cat-aseo", name: "Aseo", products: [] }]);
  });
});
