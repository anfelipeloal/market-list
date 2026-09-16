import { describe, expect, it } from "vitest";
import { finishTripAffectedIds } from "./finish-trip";

describe("Finish Trip", () => {
  it("affects every In Cart Product", () => {
    const products = [
      { id: "prod-leche", name: "Leche", categoryId: "cat-lacteos", status: "in_cart" as const },
      { id: "prod-pan", name: "Pan", categoryId: "cat-panaderia", status: "in_cart" as const },
    ];

    expect(finishTripAffectedIds(products)).toEqual(["prod-leche", "prod-pan"]);
  });

  it("keeps a Product still needed (on the Shopping List but not In Cart) untouched", () => {
    const products = [
      { id: "prod-huevos", name: "Huevos", categoryId: "cat-lacteos", status: "shopping_list" as const },
    ];

    expect(finishTripAffectedIds(products)).toEqual([]);
  });

  it("keeps a Product already in the Pantry untouched", () => {
    const products = [{ id: "prod-sal", name: "Sal", categoryId: "cat-despensa", status: "pantry" as const }];

    expect(finishTripAffectedIds(products)).toEqual([]);
  });

  it("affects nothing when no Product is In Cart", () => {
    expect(finishTripAffectedIds([])).toEqual([]);
  });
});
