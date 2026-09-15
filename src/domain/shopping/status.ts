// A Product is always in exactly one of these three states (see CONTEXT.md).
export type ProductStatus = "pantry" | "shopping_list" | "in_cart";

// The shape every Shopping domain function needs about a Product: the catalog identity plus its
// current status.
export interface ProductWithStatus {
  id: string;
  name: string;
  categoryId: string;
  status: ProductStatus;
}

export type ShoppingTransition = "moveToShoppingList" | "returnToPantry";

interface TransitionRule {
  from: ProductStatus;
  to: ProductStatus;
}

// Each named transition allows exactly one starting status and lands on exactly one resulting
// status; anything else is a stale-state result (someone else changed the Product's status in
// the meantime). Ticket #10 adds shopping_list -> in_cart (check off), in_cart -> shopping_list
// (uncheck) and Finish Trip (in_cart -> pantry) here, without restructuring this table.
const TRANSITIONS: Record<ShoppingTransition, TransitionRule> = {
  moveToShoppingList: { from: "pantry", to: "shopping_list" },
  returnToPantry: { from: "shopping_list", to: "pantry" },
};

// The (from, to) pair a named transition allows. The database layer uses this to perform the
// transition as a single conditional UPDATE (see src/db/products.ts#applyProductTransition),
// rather than duplicating these pairs itself.
export function transitionRule(transition: ShoppingTransition): TransitionRule {
  return TRANSITIONS[transition];
}

export type ApplyTransitionResult = { outcome: "valid"; to: ProductStatus } | { outcome: "stale" };

// Pure check of whether `transition` is allowed starting from `currentStatus`. This is the same
// rule the database layer enforces as a conditional UPDATE, so a concurrent change between
// reading a Product's status and writing the new one always wins the race instead of being
// silently overwritten by an in-memory decision like this one; this function exists so the rule
// itself has a single, independently testable definition.
export function applyTransition(transition: ShoppingTransition, currentStatus: ProductStatus): ApplyTransitionResult {
  const rule = TRANSITIONS[transition];
  if (currentStatus !== rule.from) return { outcome: "stale" };
  return { outcome: "valid", to: rule.to };
}
