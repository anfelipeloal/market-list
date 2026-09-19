"use client";

import { useRef, useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { createProduct, type CreateProductState } from "./actions";
import { CreateNameForm } from "./create-name-form";

export function ProductForm({
  categoryId,
  categoryName,
  onMoveToShoppingList,
}: {
  categoryId: string;
  categoryName: string;
  // Shared with pantry-search.tsx: performs the actual move (and the undo toast on success), so
  // there is one place that owns hiding a moved Product from the Despensa regardless of whether
  // the move started from tapping its row or from this duplicate-create offer.
  onMoveToShoppingList: (productId: string, productName: string) => Promise<boolean>;
}) {
  const [movedProductId, setMovedProductId] = useState<string | null>(null);
  const [moving, startMoving] = useTransition();
  // Guards the "Agregar a la lista de compras" button against a double tap landing before
  // `moving` (state, and so its `disabled` prop) has actually re-rendered — the same class of bug
  // as Deshacer's double-tap (see pantry-search.tsx#undoInFlight), fixed the same way: a
  // synchronous ref checked before anything else runs.
  const movingRef = useRef(false);

  return (
    <CreateNameForm<CreateProductState>
      action={createProduct}
      label={`Nuevo producto en ${categoryName}`}
      placeholder="Nuevo producto"
      submitLabel={`Agregar producto a ${categoryName}`}
      submitIcon={PlusIcon}
      formClassName="flex flex-col gap-2 px-4 py-3"
      buttonClassName="bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"
      hiddenFields={{ categoryId }}
      getError={(state) => (state?.kind === "error" ? state.error : undefined)}
      renderExtra={(state) => {
        if (state?.kind === "duplicatePantry" && state.productId !== movedProductId) {
          const { productId, productName } = state;
          return (
            <div role="alert" className="mt-2 flex flex-col items-start gap-2 rounded-lg border bg-muted px-3 py-2 text-sm">
              <p>{state.message}</p>
              <button
                type="button"
                disabled={moving}
                onClick={() => {
                  if (movingRef.current) return;
                  movingRef.current = true;
                  startMoving(async () => {
                    const moved = await onMoveToShoppingList(productId, productName);
                    movingRef.current = false;
                    if (moved) setMovedProductId(productId);
                  });
                }}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Agregar a la lista de compras
              </button>
            </div>
          );
        }
        if (state?.kind === "duplicateShoppingList") {
          return (
            <p role="alert" className="mt-2 text-sm text-muted-foreground">
              {state.message}
            </p>
          );
        }
        return null;
      }}
    />
  );
}
