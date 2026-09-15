"use client";

import { editCategory } from "@/app/actions";
import { CreateNameForm } from "@/app/create-name-form";

export function EditCategoryForm({ categoryId, currentName }: { categoryId: string; currentName: string }) {
  return (
    <CreateNameForm
      action={editCategory}
      label="Nombre de la categoría"
      labelVisible
      defaultValue={currentName}
      submitLabel="Guardar"
      formClassName="mt-6 flex flex-col gap-2 rounded-xl border bg-card p-4"
      buttonClassName="shrink-0 rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-50"
      hiddenFields={{ categoryId }}
    />
  );
}
