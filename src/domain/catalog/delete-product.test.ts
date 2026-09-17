import { describe, expect, it } from "vitest";
import { validateProductDeletion } from "./delete-product";

describe("deleting a Product", () => {
  it("rejects a Product that does not exist", () => {
    expect(validateProductDeletion("prod-unknown", [])).toEqual({ outcome: "notFound" });
  });

  it("allows deleting a Product in the Pantry", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "pantry" as const }];

    expect(validateProductDeletion("prod-1", existingProducts)).toEqual({
      outcome: "allowed",
      product: { id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "pantry" },
    });
  });

  it("allows deleting a Product on the Shopping List", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "shopping_list" as const }];

    expect(validateProductDeletion("prod-1", existingProducts)).toEqual({
      outcome: "allowed",
      product: { id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "shopping_list" },
    });
  });

  it("allows deleting a Product In Cart", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" as const }];

    expect(validateProductDeletion("prod-1", existingProducts)).toEqual({
      outcome: "allowed",
      product: { id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" },
    });
  });
});
