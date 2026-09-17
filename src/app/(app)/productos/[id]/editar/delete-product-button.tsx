"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProduct } from "@/app/(app)/actions";
import { deleteProductRefusalMessage } from "@/app/(app)/catalog-messages";
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

const DELETE_TOAST_ID = "delete-product";

// "Eliminar" on the edit-Producto page (ticket #15): only rendered for an Admin (isAdmin, passed
// down from the page's own requireUser() call) — hiding it from anyone else is a courtesy only,
// deleteProduct's own requireAdmin() call (src/app/(app)/actions.ts) is the real enforcement.
// Unlike deleting a Category (see ./delete-category-button.tsx's sibling in
// categorias/[id]/editar/), deleting a Product has no refusal beyond "not found" — it is allowed
// from any status (Pantry, Shopping List or In Cart — CONTEXT.md) — but the confirmation dialog and
// success/refusal handling otherwise match it exactly.
export function DeleteProductButton({
  productId,
  productName,
  isAdmin,
}: {
  productId: string;
  productName: string;
  isAdmin: boolean;
}) {
  const [isDeleting, startTransition] = useTransition();
  const router = useRouter();

  if (!isAdmin) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct(productId);

      if (result.outcome === "ok") {
        toast(`${productName} se eliminó.`, { id: DELETE_TOAST_ID });
        router.push("/");
        return;
      }
      toast(deleteProductRefusalMessage(result.outcome), { id: DELETE_TOAST_ID });
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
            <AlertDialogTitle>¿Eliminar {productName}?</AlertDialogTitle>
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
