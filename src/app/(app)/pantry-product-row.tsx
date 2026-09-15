"use client";

import Link from "next/link";
import { useTransition } from "react";

// A Pantry Product's row: the name itself is a large tappable button that moves the Product to
// the Shopping List (ticket #9); "Editar" is a separate sibling link so tapping it never also
// triggers the move.
export function PantryProductRow({
  product,
  onTap,
}: {
  product: { id: string; name: string };
  onTap: (productId: string, productName: string) => Promise<boolean>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 px-2 py-1 text-base">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await onTap(product.id, product.name);
          })
        }
        className="min-w-0 flex-1 truncate rounded-lg px-2 py-3 text-left text-base disabled:opacity-50"
      >
        {product.name}
      </button>
      <Link
        href={`/productos/${product.id}/editar`}
        className="shrink-0 px-2 py-3 text-sm text-muted-foreground underline"
      >
        Editar
      </Link>
    </li>
  );
}
