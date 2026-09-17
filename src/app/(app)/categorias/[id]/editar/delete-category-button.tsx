"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteCategory } from "@/app/(app)/actions";
import { deleteCategoryRefusalMessage } from "@/app/(app)/catalog-messages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DELETE_TOAST_ID = "delete-category";

// "Eliminar" on the edit-Categoría page (ticket #15): only rendered for an Admin (isAdmin, passed
// down from the page's own requireUser() call) — hiding it from anyone else is a courtesy only,
// deleteCategory's own requireAdmin() call (src/app/(app)/actions.ts) is the real enforcement.
// Confirmed via an AlertDialog exactly like "Eliminar" on the Usuarios screen
// (src/app/(app)/usuarios/user-row.tsx): deleting a Category can be refused when it still has
// Products, so a refusal is shown as a toast and the dialog is left open, the same as that row's
// own handleRemove. A successful delete has nowhere left to show on this page (the Category is
// gone), so it toasts "{Nombre} se eliminó." and navigates back to the Despensa.
export function DeleteCategoryButton({
  categoryId,
  categoryName,
  isAdmin,
}: {
  categoryId: string;
  categoryName: string;
  isAdmin: boolean;
}) {
  const [isDeleting, startTransition] = useTransition();
  const router = useRouter();

  if (!isAdmin) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategory(categoryId);

      if (result.outcome === "ok") {
        toast(`${categoryName} se eliminó.`, { id: DELETE_TOAST_ID });
        router.push("/");
        return;
      }
      toast(deleteCategoryRefusalMessage(result.outcome), { id: DELETE_TOAST_ID });
    });
  };

  return (
    <div className="mt-6 rounded-xl border border-destructive/40 bg-card p-4">
      <AlertDialog>
        <AlertDialogTrigger
          disabled={isDeleting}
          className="w-full rounded-lg border border-destructive/40 px-4 py-3 text-base font-medium text-destructive disabled:opacity-50"
        >
          Eliminar
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {categoryName}?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
