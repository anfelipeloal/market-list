import { dedupeValidIds } from "../ids";
import { transitionRule, type ProductStatus, type ProductWithStatus } from "./status";

// The ids of every Product In Cart: exactly what Finish Trip returns to the Pantry (see
// src/db/products.ts#finishTrip, which performs the actual `UPDATE ... WHERE status = 'in_cart'`
// as a single atomic statement). A Product still needed (on the Shopping List but not In Cart)
// and a Product already in the Pantry are both simply absent from this list, so they are left
// exactly as they were. Undo restores exactly these same ids back to In Cart (see
// src/db/products.ts#undoFinishTrip), so this is also the domain-level guarantee behind "undo
// restores exactly the affected Products": it restores exactly what this function said Finish
// Trip affected.
export function finishTripAffectedIds(products: readonly ProductWithStatus[]): string[] {
  return products.filter((product) => product.status === "in_cart").map((product) => product.id);
}

export type UndoFinishTripDecision = { outcome: "ok"; ids: string[] } | { outcome: "stale" };

// Decides whether Undo Finish Trip may proceed, given the ids Finish Trip returned to the Pantry
// (affectedIds) and the current Products. Only a Product still in the Pantry — the status Finish
// Trip left it in, i.e. undoFinishTrip's own `from` status — is restorable; a Product missing from
// `products` altogether is treated the same as one that changed status, since either way it can no
// longer be confirmed restorable. If every requested id is restorable the undo may proceed with
// exactly that (cleaned) set; if even one isn't, the whole undo is refused as stale rather than
// silently restoring a partial set, mirroring Finish Trip's own all-or-nothing guarantee.
// dedupeValidIds cleans the input first, so a malformed or duplicate id never inflates the count
// this decision is based on; a request left with nothing after cleaning is a no-op, not a refusal.
//
// src/db/products.ts#undoFinishTrip calls this with a minimal {id, status} view built from what
// its own atomic UPDATE ... RETURNING already determined (a returned id was restorable, any other
// requested id provably was not — the WHERE clause would have matched it otherwise), rather than
// from a separate read: this function's "current Products" input only ever needs id and status,
// never the catalog fields a real ProductWithStatus also carries.
export function decideUndoFinishTrip(
  affectedIds: readonly string[],
  products: readonly Pick<ProductWithStatus, "id" | "status">[],
): UndoFinishTripDecision {
  const ids = dedupeValidIds(affectedIds);
  if (ids.length === 0) return { outcome: "ok", ids: [] };

  const restorableStatus: ProductStatus = transitionRule("undoFinishTrip").from;
  const statusById = new Map(products.map((product) => [product.id, product.status]));
  const everyIdRestorable = ids.every((id) => statusById.get(id) === restorableStatus);

  return everyIdRestorable ? { outcome: "ok", ids } : { outcome: "stale" };
}
