import { describe, expect, it } from "vitest";
import { RESET_TRANSITION, transitionRule } from "./status";

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

describe("marking a Product In Cart", () => {
  it("is allowed only from the Shopping List", () => {
    expect(transitionRule("markInCart")).toEqual({ from: "shopping_list", to: "in_cart" });
  });
});

describe("marking a Product still needed (the undo of marking it In Cart)", () => {
  it("is allowed only from In Cart", () => {
    expect(transitionRule("unmarkInCart")).toEqual({ from: "in_cart", to: "shopping_list" });
  });
});

describe("Finish Trip", () => {
  it("returns every In Cart Product to the Pantry", () => {
    expect(transitionRule("finishTrip")).toEqual({ from: "in_cart", to: "pantry" });
  });
});

describe("undoing Finish Trip", () => {
  it("is the exact inverse of Finish Trip: Pantry back to In Cart", () => {
    expect(transitionRule("undoFinishTrip")).toEqual({ from: "pantry", to: "in_cart" });
  });
});

describe("Reset", () => {
  it("returns every Product on the Shopping List, In Cart or not, to the Pantry", () => {
    expect(RESET_TRANSITION).toEqual({ from: ["shopping_list", "in_cart"], to: "pantry" });
  });
});
