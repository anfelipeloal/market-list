import { describe, expect, it } from "vitest";
import { validateProductRename } from "./rename-product";

const categories = [
  { id: "cat-frutas", name: "Frutas" },
  { id: "cat-lacteos", name: "Lácteos y huevos" },
];

const products = [
  { id: "prod-leche", name: "Leche", categoryId: "cat-lacteos" },
  { id: "prod-manzana", name: "Manzana", categoryId: "cat-frutas" },
];

describe("renaming a Product", () => {
  it("rejects an unknown Product", () => {
    expect(validateProductRename("prod-unknown", "Queso", products, categories)).toEqual({ outcome: "notFound" });
  });

  it("rejects an empty name", () => {
    expect(validateProductRename("prod-leche", "", products, categories)).toEqual({ outcome: "empty" });
  });

  it("rejects a whitespace-only name", () => {
    expect(validateProductRename("prod-leche", "   ", products, categories)).toEqual({ outcome: "empty" });
  });

  it("rejects a name that collides with ANOTHER Product in any Category, naming that Product and its Category", () => {
    expect(validateProductRename("prod-manzana", "leche", products, categories)).toEqual({
      outcome: "duplicate",
      existingProduct: { id: "prod-leche", name: "Leche", categoryId: "cat-lacteos" },
      existingCategory: { id: "cat-lacteos", name: "Lácteos y huevos" },
    });
  });

  it("allows renaming to a variant of its own name and updates the display name", () => {
    expect(validateProductRename("prod-leche", "LECHE", products, categories)).toEqual({
      outcome: "valid",
      id: "prod-leche",
      name: "LECHE",
      normalizedName: "leche",
    });
  });

  it("accepts a name that does not collide with any other Product", () => {
    expect(validateProductRename("prod-leche", "Leche Deslactosada", products, categories)).toEqual({
      outcome: "valid",
      id: "prod-leche",
      name: "Leche Deslactosada",
      normalizedName: "leche deslactosada",
    });
  });

  it("stores the cleaned display name: trimmed and with internal whitespace collapsed", () => {
    expect(validateProductRename("prod-leche", "  Leche   Deslactosada ", products, categories)).toEqual({
      outcome: "valid",
      id: "prod-leche",
      name: "Leche Deslactosada",
      normalizedName: "leche deslactosada",
    });
  });
});
