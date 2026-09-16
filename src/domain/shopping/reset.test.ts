import { describe, expect, it } from "vitest";
import { resetAffectedIds } from "./reset";

// resetAffectedIds is Reset's pure decision (ticket #12, CONTEXT.md): which Products a Reset
// touches, given the current Products. src/db/products.ts#resetShoppingList performs the actual
// atomic UPDATE; this only decides which ids that statement's WHERE IN (...) is expected to match.
describe("Reset", () => {
  it("affects a Product still needed (on the Shopping List but not In Cart)", () => {
    const products = [
      { id: "prod-huevos", name: "Huevos", categoryId: "cat-lacteos", status: "shopping_list" as const },
    ];

    expect(resetAffectedIds(products)).toEqual(["prod-huevos"]);
  });

  it("affects an In Cart Product", () => {
    const products = [{ id: "prod-leche", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" as const }];

    expect(resetAffectedIds(products)).toEqual(["prod-leche"]);
  });

  it("affects both still-needed and In Cart Products together", () => {
    const products = [
      { id: "prod-huevos", name: "Huevos", categoryId: "cat-lacteos", status: "shopping_list" as const },
      { id: "prod-leche", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" as const },
    ];

    expect(resetAffectedIds(products)).toEqual(["prod-huevos", "prod-leche"]);
  });

  it("keeps a Product already in the Pantry untouched", () => {
    const products = [{ id: "prod-sal", name: "Sal", categoryId: "cat-despensa", status: "pantry" as const }];

    expect(resetAffectedIds(products)).toEqual([]);
  });

  it("affects nothing when the Shopping List is empty", () => {
    expect(resetAffectedIds([])).toEqual([]);
  });
});
