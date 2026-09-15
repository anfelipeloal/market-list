"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { createProduct } from "./actions";

export function ProductForm({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const [state, action, pending] = useActionState(createProduct, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const errorId = useId();

  // Clears the input after a successful create; an error leaves it as typed so the User can fix it.
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2 px-4 py-3">
      <label htmlFor={inputId} className="sr-only">
        Nuevo producto en {categoryName}
      </label>
      <div className="flex gap-2">
        <input type="hidden" name="categoryId" value={categoryId} />
        <input
          id={inputId}
          name="name"
          type="text"
          placeholder="Nuevo producto"
          required
          aria-describedby={state?.error ? errorId : undefined}
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
      {state?.error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
