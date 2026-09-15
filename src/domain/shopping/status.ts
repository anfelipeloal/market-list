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

export type ShoppingTransition = "moveToShoppingList" | "returnToPantry";

interface TransitionRule {
  from: ProductStatus;
  to: ProductStatus;
}

// Each named transition allows exactly one starting status and lands on exactly one resulting
// status; any other current status is a stale-state result (someone else changed the Product's
// status in the meantime). This table is the single source of truth for every Shopping
// transition: src/db/products.ts#applyProductTransition reads it to build the conditional UPDATE
// (WHERE status = rule.from) that enforces the rule atomically against a concurrent change.
// Ticket #10 adds shopping_list -> in_cart (check off), in_cart -> shopping_list (uncheck) and
// Finish Trip (in_cart -> pantry) here, without restructuring this table.
const TRANSITIONS: Record<ShoppingTransition, TransitionRule> = {
  moveToShoppingList: { from: "pantry", to: "shopping_list" },
  returnToPantry: { from: "shopping_list", to: "pantry" },
};

// The (from, to) pair a named transition allows.
export function transitionRule(transition: ShoppingTransition): TransitionRule {
  return TRANSITIONS[transition];
}
