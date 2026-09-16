"use client";

import { renameUser } from "@/app/(app)/usuarios/actions";
import { CreateNameForm } from "@/app/(app)/create-name-form";

// Renaming a User (ticket #13) reuses the shared single-name form (src/app/(app)/create-name-form.tsx),
// exactly like EditCategoryForm (src/app/(app)/categorias/[id]/editar/edit-category-form.tsx):
// only the name changes here, never the PIN or the Admin role (out of scope until ticket #14).
export function EditUserForm({ userId, currentName }: { userId: string; currentName: string }) {
  return (
    <CreateNameForm
      action={renameUser}
      label="Nombre del usuario"
      labelVisible
      defaultValue={currentName}
      submitLabel="Guardar"
      formClassName="mt-6 flex flex-col gap-2 rounded-xl border bg-card p-4"
      buttonClassName="shrink-0 rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-50"
      hiddenFields={{ userId }}
    />
  );
}
