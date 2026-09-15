"use client";

import { createCategory } from "./actions";
import { CreateNameForm } from "./create-name-form";

export function CategoryForm() {
  return (
    <CreateNameForm
      action={createCategory}
      label="Nueva categoría"
      labelVisible
      formClassName="mt-8 flex flex-col gap-2 rounded-xl border bg-card p-4"
      buttonClassName="shrink-0 rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-50"
    />
  );
}
