import { RESET_TRANSITION, type ProductWithStatus } from "./status";

// Reset (ticket #12, CONTEXT.md): every Product whose status is on the Shopping List, whether In
// Cart or not, returns to the Pantry at once. A Product already in the Pantry is simply absent
// from this list — the same shape as finishTripAffectedIds for Finish Trip (see
// src/domain/shopping/finish-trip.ts) — and Reset never deletes anything, so this only ever
// decides which ids move, never which rows disappear. Unlike Finish Trip, Reset has no undo (see
// CONTEXT.md): it is guarded by a confirmation dialog in the UI instead, so there is no
// decideUndoReset counterpart.
export function resetAffectedIds(products: readonly ProductWithStatus[]): string[] {
  const affectedStatuses = RESET_TRANSITION.from;
  return products.filter((product) => affectedStatuses.includes(product.status)).map((product) => product.id);
}
