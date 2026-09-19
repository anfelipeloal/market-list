"use client";

import { useTransition } from "react";
import { PencilIcon } from "lucide-react";
import { IconLink } from "./icon-control";

// Explains what checking a Despensa Product does; rendered once by pantry-search.tsx and
// referenced by every row, since a checkbox alone only announces "not checked".
export const PANTRY_CHECKBOX_HINT_ID = "pantry-checkbox-hint";

// A Pantry Product's row: a checkbox that moves the Product to the Shopping List (ticket #9). The
// label wraps the whole name, so the row keeps its large tap target, and "Editar" is a separate
// sibling link so tapping it never also triggers the move. The box shows checked while the move is
// in flight; on success the row leaves the Despensa, and if the move is refused it unchecks again.
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
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-3 has-disabled:opacity-50">
        <input
          type="checkbox"
          checked={pending}
          disabled={pending}
          aria-describedby={PANTRY_CHECKBOX_HINT_ID}
          onChange={() =>
            startTransition(async () => {
              await onTap(product.id, product.name);
            })
          }
          className="size-5 shrink-0 cursor-pointer accent-primary"
        />
        <span className="min-w-0 truncate">{product.name}</span>
      </label>
      <IconLink
        href={`/productos/${product.id}/editar`}
        icon={PencilIcon}
        label={`Editar ${product.name}`}
      />
    </li>
  );
}
