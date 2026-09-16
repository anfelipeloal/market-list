import { describe, expect, it } from "vitest";
import { decideUndoFinishTrip, finishTripAffectedIds } from "./finish-trip";

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

describe("undoing Finish Trip", () => {
  const leche = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const pan = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";

  it("restores exactly the affected Products when every one is still in the Pantry", () => {
    const products = [
      { id: leche, status: "pantry" as const },
      { id: pan, status: "pantry" as const },
    ];

    expect(decideUndoFinishTrip([leche, pan], products)).toEqual({ outcome: "ok", ids: [leche, pan] });
  });

  it("is refused as stale when one affected Product is no longer in the Pantry", () => {
    const products = [
      { id: leche, status: "pantry" as const },
      { id: pan, status: "shopping_list" as const },
    ];

    expect(decideUndoFinishTrip([leche, pan], products)).toEqual({ outcome: "stale" });
  });

  it("is refused as stale when an affected Product is missing from the current Products", () => {
    const products = [{ id: leche, status: "pantry" as const }];

    expect(decideUndoFinishTrip([leche, pan], products)).toEqual({ outcome: "stale" });
  });

  it("drops a malformed id and restores the rest", () => {
    const products = [{ id: leche, status: "pantry" as const }];

    expect(decideUndoFinishTrip(["not-a-uuid", leche], products)).toEqual({ outcome: "ok", ids: [leche] });
  });

  it("collapses a duplicate id to one", () => {
    const products = [{ id: leche, status: "pantry" as const }];

    expect(decideUndoFinishTrip([leche, leche], products)).toEqual({ outcome: "ok", ids: [leche] });
  });

  it("is a no-op, not a refusal, for an empty list of affected ids", () => {
    expect(decideUndoFinishTrip([], [])).toEqual({ outcome: "ok", ids: [] });
  });
});
