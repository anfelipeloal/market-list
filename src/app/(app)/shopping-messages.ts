// Spanish copy for the two outcomes shared by every Shopping transition that can go stale or miss
// (moveToShoppingList, returnToPantry, toggleInCart — see shopping-actions.ts): a concurrent
// change is always reported the same way, regardless of which action attempted it. Shared by
// src/app/(app)/pantry-search.tsx and src/app/(app)/lista/shopping-list-view.tsx so this copy (and
// the outcome-to-message mapping) has exactly one home instead of drifting between the two.
//
// Finish Trip's own undo has a different stale message ("La lista cambió...", see
// shopping-list-view.tsx): it's refusing a batch, not a single Product, so it isn't part of this
// shared mapper.
const STALE_MESSAGE = "Este producto cambió. Actualiza la página.";
const NOT_FOUND_MESSAGE = "No encontramos ese producto.";

export function shoppingResultMessage(outcome: "stale" | "notFound"): string {
  return outcome === "notFound" ? NOT_FOUND_MESSAGE : STALE_MESSAGE;
}
