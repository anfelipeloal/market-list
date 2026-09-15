import { describe, expect, it } from "vitest";
import { transitionRule } from "./status";

// transitionRule is the single source of truth every Shopping transition is defined against (see
// src/db/products.ts#applyProductTransition, which turns the pair it returns into the WHERE
// clause of a conditional UPDATE). Testing it directly here keeps the transition table itself
// under test without a parallel in-memory implementation of the rule that nothing in production
// calls; ticket #10 extends this table (and these tests) with shopping_list <-> in_cart and
// Finish Trip.
describe("moving a Product to the Shopping List", () => {
  it("is allowed only from the Pantry", () => {
    expect(transitionRule("moveToShoppingList")).toEqual({ from: "pantry", to: "shopping_list" });
  });
});

describe("returning a Product to the Pantry (the undo of moving it to the Shopping List)", () => {
  it("is allowed only from the Shopping List", () => {
    expect(transitionRule("returnToPantry")).toEqual({ from: "shopping_list", to: "pantry" });
  });
});
