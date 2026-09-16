"use client";

import { useTransition } from "react";

// A Shopping List Product's row: the whole row is a large tappable button that toggles the
// Product In Cart (ticket #10) — tapping an In Cart row taps it back to still needed, which is
// its own undo, so no undo notification is shown for this (see shopping-list-view.tsx). In Cart
// is shown struck through and muted; aria-pressed carries that state to assistive tech the same
// way a toggle button would.
export function ShoppingListProductRow({
  product,
  onToggle,
}: {
  product: { id: string; name: string; inCart: boolean };
  onToggle: (productId: string, inCart: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li>
      <button
        type="button"
        aria-pressed={product.inCart}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await onToggle(product.id, product.inCart);
          })
        }
        className={`block w-full px-4 py-3 text-left text-base disabled:opacity-50 ${
          product.inCart ? "text-muted-foreground line-through" : ""
        }`}
      >
        {product.name}
      </button>
    </li>
  );
}
