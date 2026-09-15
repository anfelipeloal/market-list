import { describe, expect, it } from "vitest";
import { validateProductMove } from "./move-product";

const categories = [
  { id: "cat-frutas", name: "Frutas" },
  { id: "cat-lacteos", name: "Lácteos y huevos" },
];

const products = [
  { id: "prod-leche", name: "Leche", categoryId: "cat-lacteos" },
  { id: "prod-manzana", name: "Manzana", categoryId: "cat-frutas" },
];

describe("moving a Product between Categories", () => {
  it("rejects an unknown Product", () => {
    expect(validateProductMove("prod-unknown", "cat-frutas", products, categories)).toEqual({
      outcome: "productNotFound",
    });
  });

  it("rejects an unknown Category", () => {
    expect(validateProductMove("prod-leche", "cat-unknown", products, categories)).toEqual({
      outcome: "categoryNotFound",
    });
  });

  it("moves a Product to a different Category", () => {
    expect(validateProductMove("prod-leche", "cat-frutas", products, categories)).toEqual({
      outcome: "valid",
      id: "prod-leche",
      categoryId: "cat-frutas",
    });
  });

  it("allows moving a Product to the Category it is already in, changing nothing", () => {
    expect(validateProductMove("prod-leche", "cat-lacteos", products, categories)).toEqual({
      outcome: "valid",
      id: "prod-leche",
      categoryId: "cat-lacteos",
    });
  });
});
