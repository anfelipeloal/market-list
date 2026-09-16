import type { ProductWithStatus } from "./status";

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
