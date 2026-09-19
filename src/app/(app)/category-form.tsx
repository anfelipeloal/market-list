"use client";

import { PlusIcon } from "lucide-react";
import { createCategory } from "./actions";
import { CreateNameForm } from "./create-name-form";

export function CategoryForm() {
  return (
    <CreateNameForm
      action={createCategory}
      label="Nueva categoría"
      labelVisible
      submitLabel="Agregar categoría"
      submitIcon={PlusIcon}
      formClassName="mt-8 flex flex-col gap-2 rounded-xl border bg-card p-4"
      buttonClassName="bg-primary text-primary-foreground hover:bg-primary/80"
    />
  );
}
