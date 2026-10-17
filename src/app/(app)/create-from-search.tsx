"use client";

import { useActionState, useId, useState } from "react";
import { PlusIcon } from "lucide-react";
import { createProduct, type CreateProductState } from "./actions";
import { IconButton } from "./icon-control";
import { CreateProductNotice } from "./product-form";

// The create block shown at the top of the results while searching: offers to create a Product
// named exactly what the User typed. It submits through the same `createProduct` action as the
// per-Category form, so every rule (duplicates in any Category, the Shopping List message, races)
// applies unchanged. The caller keys it by the search text, so a stale outcome never outlives the
// text it was about.
export function CreateFromSearch({
  name,
  categories,
  suggestedCategoryId,
  onMoveToShoppingList,
}: {
  name: string;
  categories: ReadonlyArray<{ id: string; name: string }>;
  suggestedCategoryId: string | undefined;
  onMoveToShoppingList: (productId: string, productName: string) => Promise<boolean>;
}) {
  const [state, formAction, pending] = useActionState<CreateProductState, FormData>(createProduct, undefined);
  // null = follow the suggestion, which changes as the results change; once the User picks a
  // Category, their choice sticks (while it still exists).
  const [chosenCategoryId, setChosenCategoryId] = useState<string | null>(null);
  const selectId = useId();

  const chosenStillExists = chosenCategoryId !== null && categories.some((category) => category.id === chosenCategoryId);
  const categoryId = chosenStillExists ? chosenCategoryId : (suggestedCategoryId ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3">
      <p className="text-sm font-medium">¿No está? Crear «{name}»</p>
      <input type="hidden" name="name" value={name} />
      <div className="flex gap-2">
        <label htmlFor={selectId} className="sr-only">
          Categoría
        </label>
        <select
          id={selectId}
          name="categoryId"
          required
          value={categoryId}
          onChange={(event) => setChosenCategoryId(event.target.value)}
          className="h-(--control-height) min-w-0 flex-1 rounded-lg border bg-background px-3 text-base"
        >
          <option value="" disabled>
            Elige una categoría
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <IconButton
          type="submit"
          icon={PlusIcon}
          label={`Crear producto ${name}`}
          disabled={pending}
          className="bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"
        />
      </div>
      {state?.kind === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <CreateProductNotice state={state} onMoveToShoppingList={onMoveToShoppingList} />
    </form>
  );
}
