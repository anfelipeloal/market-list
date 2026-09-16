"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import type { SignedInUser } from "@/db/users";
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
import { removeUser } from "./actions";

const REMOVE_TOAST_ID = "remove-user";
const FORBIDDEN_MESSAGE = "Solo un administrador puede administrar usuarios.";
const LAST_ADMIN_MESSAGE = "Debe quedar al menos un administrador.";
const NOT_FOUND_MESSAGE = "No encontramos ese usuario.";

// One row of the Usuarios list (ticket #13): a link to rename this User and an "Eliminar" button
// guarded by a confirmation dialog (reusing the AlertDialog added for Reiniciar lista in ticket
// #12, see src/app/(app)/lista/shopping-list-view.tsx). removeUser() enforces the Admin check and
// the last-Admin guard server-side regardless of what renders here — "forbidden" is only reachable
// in practice through a tampered/replayed request, since a non-Admin never sees this screen at
// all.
export function UserRow({ user, onRemoved }: { user: SignedInUser; onRemoved: (userId: string) => void }) {
  const [isRemoving, startRemoveTransition] = useTransition();

  const handleRemove = () => {
    startRemoveTransition(async () => {
      const result = await removeUser(user.id);

      if (result.outcome === "ok") {
        onRemoved(user.id);
        return;
      }
      if (result.outcome === "forbidden") {
        toast(FORBIDDEN_MESSAGE, { id: REMOVE_TOAST_ID });
        return;
      }
      if (result.outcome === "lastAdmin") {
        toast(LAST_ADMIN_MESSAGE, { id: REMOVE_TOAST_ID });
        return;
      }
      toast(NOT_FOUND_MESSAGE, { id: REMOVE_TOAST_ID });
    });
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
      <div className="flex flex-col">
        <span className="font-medium">{user.name}</span>
        {user.isAdmin ? <span className="text-sm text-muted-foreground">Administrador</span> : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Link href={`/usuarios/${user.id}/editar`} className="text-sm text-muted-foreground underline">
          Renombrar
        </Link>

        <AlertDialog>
          <AlertDialogTrigger
            disabled={isRemoving}
            className="rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive disabled:opacity-50"
          >
            Eliminar
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar a {user.name}?</AlertDialogTitle>
              <AlertDialogDescription>{user.name} perderá acceso a la aplicación de inmediato.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={isRemoving} onClick={handleRemove}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
