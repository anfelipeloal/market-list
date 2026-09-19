"use client";

import { useActionState, useId } from "react";
import { editProduct } from "@/app/(app)/actions";

// A single form ("Guardar") both renames the Product and moves it to the selected Categoría: see
// src/app/actions.ts (editProduct) for why one submit covers both instead of two separate forms.
export function EditProductForm({
  productId,
  currentName,
  categoryId,
  categories,
}: {
  productId: string;
  currentName: string;
  categoryId: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(editProduct, undefined);
  const nameId = useId();
  const categoryFieldId = useId();
  const errorId = useId();

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4 rounded-xl border bg-card p-4">
      <input type="hidden" name="productId" value={productId} />

      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className="text-sm font-medium">
          Nombre del producto
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          defaultValue={currentName}
          required
          aria-describedby={state?.error ? errorId : undefined}
          className="h-(--control-height) rounded-lg border bg-background px-3 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={categoryFieldId} className="text-sm font-medium">
          Categoría
        </label>
        <select
          id={categoryFieldId}
          name="categoryId"
          defaultValue={categoryId}
          className="h-(--control-height) rounded-lg border bg-background px-3 text-base"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {state?.error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-(--control-height) rounded-lg bg-primary px-4 text-base font-medium text-primary-foreground disabled:opacity-50"
      >
        Guardar
      </button>
    </form>
  );
}
