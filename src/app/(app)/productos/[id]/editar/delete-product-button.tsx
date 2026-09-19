"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProduct } from "@/app/(app)/actions";
import { deleteProductRefusalMessage } from "@/app/(app)/catalog-messages";
import { ConfirmDeleteButton } from "@/app/(app)/confirm-delete-button";

const DELETE_TOAST_ID = "delete-product";

// "Eliminar" on the edit-Producto page (ticket #15): only rendered for an Admin (isAdmin, passed
// down from the page's own requireUser() call) — hiding it from anyone else is a courtesy only,
// deleteProduct's own requireAdmin() call (src/app/(app)/actions.ts) is the real enforcement.
// Unlike deleting a Category (see ./delete-category-button.tsx's sibling in
// categorias/[id]/editar/), deleting a Product has no refusal beyond "not found" — it is allowed
// from any status (Pantry, Shopping List or In Cart — CONTEXT.md). The confirm-then-delete flow
// itself lives in ConfirmDeleteButton (src/app/(app)/confirm-delete-button.tsx), shared with that
// sibling and usuarios/user-row.tsx's own Eliminar.
export function DeleteProductButton({
  productId,
  productName,
  isAdmin,
}: {
  productId: string;
  productName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();

  if (!isAdmin) return null;

  return (
    <div className="mt-6 flex justify-center rounded-xl border border-destructive/40 bg-card p-4">
      <ConfirmDeleteButton
        label={`Eliminar ${productName}`}
        title={`¿Eliminar ${productName}?`}
        description="Esta acción no se puede deshacer."
        toastId={DELETE_TOAST_ID}
        action={() => deleteProduct(productId)}
        refusalMessage={deleteProductRefusalMessage}
        onSuccess={() => {
          toast(`${productName} se eliminó.`, { id: DELETE_TOAST_ID });
          router.push("/");
        }}
      />
    </div>
  );
}
