// One home for "a Product id no longer matches any row" (see catalog-messages.ts's own comment):
// imported rather than repeated here so the wording can't drift between a stale Shopping
// transition and a Catalog action's own not-found outcome.
import { PRODUCT_NOT_FOUND_MESSAGE } from "./catalog-messages";

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

export function shoppingResultMessage(outcome: "stale" | "notFound"): string {
  return outcome === "notFound" ? PRODUCT_NOT_FOUND_MESSAGE : STALE_MESSAGE;
}
