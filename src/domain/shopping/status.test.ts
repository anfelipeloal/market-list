import { describe, expect, it } from "vitest";
import { applyTransition } from "./status";

describe("moving a Product to the Shopping List", () => {
  it("is allowed from the Pantry", () => {
    expect(applyTransition("moveToShoppingList", "pantry")).toEqual({ outcome: "valid", to: "shopping_list" });
  });

  it("rejects a Product already on the Shopping List as stale", () => {
    expect(applyTransition("moveToShoppingList", "shopping_list")).toEqual({ outcome: "stale" });
  });

  it("rejects a Product already In Cart as stale", () => {
    expect(applyTransition("moveToShoppingList", "in_cart")).toEqual({ outcome: "stale" });
  });
});

describe("returning a Product to the Pantry (the undo of moving it to the Shopping List)", () => {
  it("is allowed from the Shopping List", () => {
    expect(applyTransition("returnToPantry", "shopping_list")).toEqual({ outcome: "valid", to: "pantry" });
  });

  it("rejects a Product already in the Pantry as stale", () => {
    expect(applyTransition("returnToPantry", "pantry")).toEqual({ outcome: "stale" });
  });

  it("rejects a Product In Cart as stale", () => {
    expect(applyTransition("returnToPantry", "in_cart")).toEqual({ outcome: "stale" });
  });
});
