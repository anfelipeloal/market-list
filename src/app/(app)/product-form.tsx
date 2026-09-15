"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { createProduct } from "./actions";

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
  const [state, formAction, pending] = useActionState(createProduct, undefined);
  const [movedProductId, setMovedProductId] = useState<string | null>(null);
  const [moving, startMoving] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const errorId = useId();

  // Clears the input after a successful create; an error or duplicate outcome leaves it as typed
  // so the User can see what they searched for.
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  const showDuplicatePantry = state?.kind === "duplicatePantry" && state.productId !== movedProductId;

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <label htmlFor={inputId} className="sr-only">{`Nuevo producto en ${categoryName}`}</label>
        <div className="flex gap-2">
          <input type="hidden" name="categoryId" value={categoryId} />
          <input
            id={inputId}
            name="name"
            type="text"
            placeholder="Nuevo producto"
            required
            aria-describedby={state?.kind === "error" ? errorId : undefined}
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-3 text-base"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-secondary px-4 py-3 text-base font-medium text-secondary-foreground disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </form>

      {state?.kind === "error" ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {showDuplicatePantry && state?.kind === "duplicatePantry" ? (
        <div role="alert" className="flex flex-col items-start gap-2 rounded-lg border bg-muted px-3 py-2 text-sm">
          <p>{state.message}</p>
          <button
            type="button"
            disabled={moving}
            onClick={() => {
              const { productId, productName } = state;
              startMoving(async () => {
                const moved = await onMoveToShoppingList(productId, productName);
                if (moved) setMovedProductId(productId);
              });
            }}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Agregar a la lista de compras
          </button>
        </div>
      ) : null}

      {state?.kind === "duplicateShoppingList" ? (
        <p role="alert" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
