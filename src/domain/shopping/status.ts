// The three values a Product's status can take (see CONTEXT.md), as a plain array rather than
// just a union type: src/db/schema.ts's pgEnum derives its values from this same list, so the
// database enum and the domain type can never drift apart.
export const PRODUCT_STATUSES = ["pantry", "shopping_list", "in_cart"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// The shape every Shopping domain function needs about a Product: the catalog identity plus its
// current status.
export interface ProductWithStatus {
  id: string;
  name: string;
  categoryId: string;
  status: ProductStatus;
}

export type ShoppingTransition =
  | "moveToShoppingList"
  | "returnToPantry"
  | "markInCart"
  | "unmarkInCart"
  | "finishTrip"
  | "undoFinishTrip";

interface TransitionRule {
  from: ProductStatus;
  to: ProductStatus;
}

// Each named transition allows exactly one starting status and lands on exactly one resulting
// status; any other current status is a stale-state result (someone else changed the Product's
// status in the meantime). This table is the single source of truth for every Shopping
// transition: src/db/products.ts#applyProductTransition reads it to build the conditional UPDATE
// (WHERE status = rule.from) that enforces the rule atomically against a concurrent change.
//
// markInCart/unmarkInCart (ticket #10) are the Lista de compras toggle: tapping a Product checks
// it off, tapping it again undoes that, so no separate undo transition is needed for the toggle
// itself. finishTrip and undoFinishTrip are each other's exact inverse too, but unlike the other
// four transitions they are never applied through applyProductTransition's single-id conditional
// UPDATE: Finish Trip acts on every In Cart Product at once (src/db/products.ts#finishTrip), and
// its undo is an all-or-nothing multi-id transaction (src/db/products.ts#undoFinishTrip). Both
// still read their (from, to) pair from this table so it stays the single source of truth for
// every Shopping status change, bulk or single.
const TRANSITIONS: Record<ShoppingTransition, TransitionRule> = {
  moveToShoppingList: { from: "pantry", to: "shopping_list" },
  returnToPantry: { from: "shopping_list", to: "pantry" },
  markInCart: { from: "shopping_list", to: "in_cart" },
  unmarkInCart: { from: "in_cart", to: "shopping_list" },
  finishTrip: { from: "in_cart", to: "pantry" },
  undoFinishTrip: { from: "pantry", to: "in_cart" },
};

// The (from, to) pair a named transition allows.
export function transitionRule(transition: ShoppingTransition): TransitionRule {
  return TRANSITIONS[transition];
}
