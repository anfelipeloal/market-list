"use client";

import { createProduct } from "./actions";
import { CreateNameForm } from "./create-name-form";

export function ProductForm({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  return (
    <CreateNameForm
      action={createProduct}
      label={`Nuevo producto en ${categoryName}`}
      placeholder="Nuevo producto"
      formClassName="flex flex-col gap-2 px-4 py-3"
      buttonClassName="shrink-0 rounded-lg bg-secondary px-4 py-3 text-base font-medium text-secondary-foreground disabled:opacity-50"
      hiddenFields={{ categoryId }}
    />
  );
}
