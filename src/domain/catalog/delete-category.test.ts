import { describe, expect, it } from "vitest";
import { validateCategoryDeletion } from "./delete-category";

const categories = [
  { id: "cat-lacteos", name: "Lácteos y huevos" },
  { id: "cat-frutas", name: "Frutas" },
];

describe("deleting a Category", () => {
  it("rejects a Category that does not exist", () => {
    expect(validateCategoryDeletion("cat-unknown", categories, [])).toEqual({ outcome: "notFound" });
  });

  it("allows deleting a Category that has no Products", () => {
    const existingProducts = [{ id: "prod-1", name: "Manzana", categoryId: "cat-frutas", status: "pantry" as const }];

    expect(validateCategoryDeletion("cat-lacteos", categories, existingProducts)).toEqual({
      outcome: "allowed",
      category: { id: "cat-lacteos", name: "Lácteos y huevos" },
    });
  });

  it("rejects deleting a Category that still has a Product in the Pantry", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "pantry" as const }];

    expect(validateCategoryDeletion("cat-lacteos", categories, existingProducts)).toEqual({ outcome: "hasProducts" });
  });

  it("rejects deleting a Category that still has a Product on the Shopping List", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "shopping_list" as const }];

    expect(validateCategoryDeletion("cat-lacteos", categories, existingProducts)).toEqual({ outcome: "hasProducts" });
  });

  it("rejects deleting a Category that still has a Product In Cart", () => {
    const existingProducts = [{ id: "prod-1", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" as const }];

    expect(validateCategoryDeletion("cat-lacteos", categories, existingProducts)).toEqual({ outcome: "hasProducts" });
  });
});
