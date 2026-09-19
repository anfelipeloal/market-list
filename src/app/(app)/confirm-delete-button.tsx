"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { IconButton } from "./icon-control";

// The "Eliminar" trigger + confirmation dialog + refusal-toast flow shared by every
// delete-with-confirmation control in the app: ticket #15's Category and Product delete buttons
// (categorias/[id]/editar/delete-category-button.tsx, productos/[id]/editar/delete-product-button.tsx)
// and Usuarios' own "Eliminar" on a User (usuarios/user-row.tsx) all converged on the same shape
// independently. Deliberately has no opinion on what's being deleted: the entity's name only shows
// up through the `title`/`description` strings a caller builds, and `TResult` is whatever
// `{outcome: "ok" | ...}` union the caller's own action already returns (DeleteCategoryResult,
// DeleteProductResult, RemoveUserResult), rather than one shape specific to Categories, Products or
// Users. TypeScript can't narrow a bare `TResult` by comparing `result.outcome` to the literal
// "ok" (it doesn't know TResult is a discriminated union at that point), so the one cast below
// tells it what the runtime check just proved: whatever result isn't {outcome: "ok"} has some
// other, still-string, outcome.
//
// `onSuccess` is left to the caller because the three current uses genuinely differ here — deleting
// a Category or Product has nowhere left to show on its own edit page, so it toasts success and
// navigates away, while removing a User just hides that row in a list still on screen, with no
// success toast at all (see UserRow's own former handleRemove). A refusal is always shown as a
// toast (via the caller's own outcome-to-message mapper, e.g. deleteCategoryRefusalMessage or
// userActionRefusalMessage) with the dialog left open, exactly like every one of these controls
// already did before this was extracted.
//
// The trigger itself is icon-only (UI redesign: delete is a universally-understood, repeated
// action, no ticket) via IconButton (src/app/(app)/icon-control.tsx), passed as the base-ui
// AlertDialogTrigger's own `render` target -- exactly like AlertDialogCancel does with the shadcn
// Button (src/components/ui/alert-dialog.tsx) -- so `label` (the trash icon's Spanish accessible
// name, e.g. "Eliminar Frutas") replaces the old `triggerClassName`-driven text button. The
// confirmation dialog's OWN buttons (Cancelar / Eliminar below) keep their text: only the trigger
// that opens the dialog needed to shrink.
export function ConfirmDeleteButton<TResult extends { outcome: string }>({
  label,
  title,
  description,
  triggerClassName,
  toastId,
  action,
  onSuccess,
  refusalMessage,
}: {
  // The trash icon's accessible name, specific enough to stand alone (e.g. "Eliminar Frutas",
  // "Eliminar a Ana").
  label: string;
  title: string;
  description?: string;
  // Extra classes for the icon trigger's own placement (e.g. centering it in a card); the
  // destructive-tinted icon look itself is IconButton's default, not something callers set.
  triggerClassName?: string;
  toastId: string;
  action: () => Promise<TResult>;
  onSuccess: () => void;
  refusalMessage: (outcome: Exclude<TResult["outcome"], "ok">) => string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await action();
      if (result.outcome === "ok") {
        onSuccess();
        return;
      }
      toast(refusalMessage(result.outcome as Exclude<TResult["outcome"], "ok">), { id: toastId });
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        disabled={isPending}
        render={
          <IconButton
            icon={Trash2Icon}
            label={label}
            className={cn("text-destructive hover:bg-destructive/10", triggerClassName)}
          />
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
