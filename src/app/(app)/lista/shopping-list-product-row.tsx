"use client";

import { useTransition } from "react";

// Explains what a checked box means on the Lista de compras; rendered once by
// shopping-list-view.tsx and referenced by every row, since a checkbox alone only announces
// "checked" or "not checked", not that checked means En el carrito.
export const IN_CART_CHECKBOX_HINT_ID = "in-cart-checkbox-hint";

// A Shopping List Product's row: a checkbox where checked means In Cart (ticket #10). Unchecking
// it is its own undo, so no undo notification is shown (see shopping-list-view.tsx). The label
// wraps the whole row for a large tap target, and In Cart rows stay struck through and muted. The
// box flips immediately while the change is in flight; if the server refuses it, the row falls
// back to the Product's real state.
export function ShoppingListProductRow({
  product,
  onToggle,
}: {
  product: { id: string; name: string; inCart: boolean };
  onToggle: (productId: string, inCart: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const checked = pending ? !product.inCart : product.inCart;

  return (
    <li>
      <label
        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-base has-disabled:opacity-50 ${
          checked ? "text-muted-foreground line-through" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          aria-describedby={IN_CART_CHECKBOX_HINT_ID}
          onChange={() =>
            startTransition(async () => {
              await onToggle(product.id, product.inCart);
            })
          }
          className="size-5 shrink-0 cursor-pointer accent-primary"
        />
        <span className="min-w-0">{product.name}</span>
      </label>
    </li>
  );
}
