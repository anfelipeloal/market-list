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
    const existingProducts = [{ id: "prod-1", name: "Manzana", categoryId: "cat-frutas", status: "pantry" as const }];

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

  it("rejects a name that collides with a Pantry Product, naming that Product (with its status) and its Category, so the UI can offer to move it to the Shopping List", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "pantry" as const }];

    expect(validateNewProduct("leche ", "cat-frutas", existingProducts, categories)).toEqual({
      outcome: "duplicate",
      existingProduct: { id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "pantry" },
      existingCategory: { id: "cat-lacteos", name: "Lácteos y huevos" },
    });
  });

  it("rejects a name that collides with a Product already on the Shopping List, naming its status so the UI can say it is already there", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "shopping_list" as const }];

    expect(validateNewProduct("leche", "cat-frutas", existingProducts, categories)).toEqual({
      outcome: "duplicate",
      existingProduct: { id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "shopping_list" },
      existingCategory: { id: "cat-lacteos", name: "Lácteos y huevos" },
    });
  });

  it("rejects a name that collides with a Product In Cart, naming its status", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" as const }];

    expect(validateNewProduct("leche", "cat-frutas", existingProducts, categories)).toEqual({
      outcome: "duplicate",
      existingProduct: { id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" },
      existingCategory: { id: "cat-lacteos", name: "Lácteos y huevos" },
    });
  });
});
