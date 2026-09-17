"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCategory } from "@/app/(app)/actions";
import { deleteCategoryRefusalMessage } from "@/app/(app)/catalog-messages";
import { ConfirmDeleteButton } from "@/app/(app)/confirm-delete-button";

const DELETE_TOAST_ID = "delete-category";

// "Eliminar" on the edit-Categoría page (ticket #15): only rendered for an Admin (isAdmin, passed
// down from the page's own requireUser() call) — hiding it from anyone else is a courtesy only,
// deleteCategory's own requireAdmin() call (src/app/(app)/actions.ts) is the real enforcement. The
// confirm-then-delete flow itself (dialog, pending state, refusal toast) lives in
// ConfirmDeleteButton (src/app/(app)/confirm-delete-button.tsx), shared with
// ../../productos/[id]/editar/delete-product-button.tsx and usuarios/user-row.tsx's own Eliminar. A
// successful delete has nowhere left to show on this page (the Category is gone), so onSuccess
// toasts "{Nombre} se eliminó." and navigates back to the Despensa.
export function DeleteCategoryButton({
  categoryId,
  categoryName,
  isAdmin,
}: {
  categoryId: string;
  categoryName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();

  if (!isAdmin) return null;

  return (
    <div className="mt-6 rounded-xl border border-destructive/40 bg-card p-4">
      <ConfirmDeleteButton
        title={`¿Eliminar ${categoryName}?`}
        description="Esta acción no se puede deshacer."
        triggerClassName="w-full rounded-lg border border-destructive/40 px-4 py-3 text-base font-medium text-destructive disabled:opacity-50"
        toastId={DELETE_TOAST_ID}
        action={() => deleteCategory(categoryId)}
        refusalMessage={deleteCategoryRefusalMessage}
        onSuccess={() => {
          toast(`${categoryName} se eliminó.`, { id: DELETE_TOAST_ID });
          router.push("/");
        }}
      />
    </div>
  );
}
