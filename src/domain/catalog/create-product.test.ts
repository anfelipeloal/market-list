import { describe, expect, it } from "vitest";
import { validateNewProduct } from "./create-product";

const categories = [
  { id: "cat-lacteos", name: "Lácteos y huevos" },
  { id: "cat-frutas", name: "Frutas" },
];

describe("creating a Product", () => {
  it("rejects an empty name", () => {
    expect(validateNewProduct("", "cat-lacteos", [], categories)).toEqual({ outcome: "empty" });
  });

  it("rejects a whitespace-only name", () => {
    expect(validateNewProduct("   ", "cat-lacteos", [], categories)).toEqual({ outcome: "empty" });
  });

  it("rejects a Category that does not exist", () => {
    expect(validateNewProduct("Leche", "cat-unknown", [], categories)).toEqual({ outcome: "unknownCategory" });
  });

  it("accepts a name that does not collide with any existing Product, in any Category", () => {
    const existingProducts = [{ id: "prod-1", name: "Manzana", categoryId: "cat-frutas" }];

    expect(validateNewProduct("Leche", "cat-lacteos", existingProducts, categories)).toEqual({
      outcome: "valid",
      name: "Leche",
      normalizedName: "leche",
      categoryId: "cat-lacteos",
    });
  });

  it("stores the cleaned display name: trimmed and with internal whitespace collapsed", () => {
    expect(validateNewProduct("  Leche   Deslactosada ", "cat-lacteos", [], categories)).toEqual({
      outcome: "valid",
      name: "Leche Deslactosada",
      normalizedName: "leche deslactosada",
      categoryId: "cat-lacteos",
    });
  });

  it("rejects a name that collides with a Product in ANY Category under name matching, naming that Product and its Category", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos" }];

    expect(validateNewProduct("leche ", "cat-frutas", existingProducts, categories)).toEqual({
      outcome: "duplicate",
      existingProduct: { id: "prod-1", name: "Leche", categoryId: "cat-lacteos" },
      existingCategory: { id: "cat-lacteos", name: "Lácteos y huevos" },
    });
  });
});
