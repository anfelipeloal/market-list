"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
import { grantAdmin, removeUser, revokeAdmin } from "./actions";
import { ADMIN_ONLY_MESSAGE } from "./messages";

const REMOVE_TOAST_ID = "remove-user";
const ROLE_TOAST_ID = "toggle-admin-role";
const LAST_ADMIN_MESSAGE = "Debe quedar al menos un administrador.";
const NOT_FOUND_MESSAGE = "No encontramos ese usuario.";

// One row of the Usuarios list (ticket #13, extended by #14): a link to edit this User (rename,
// Change PIN), a role toggle ("Hacer administrador" / "Quitar administrador"), and an "Eliminar"
// button guarded by a confirmation dialog (reusing the AlertDialog added for Reiniciar lista in
// ticket #12, see src/app/(app)/lista/shopping-list-view.tsx). Every action's own server function
// (removeUser, grantAdmin, revokeAdmin, all in ./actions.ts) enforces the Admin check — and, for
// removeUser/revokeAdmin, the last-Admin guard — server-side regardless of what renders here:
// "forbidden" is only reachable in practice through a tampered/replayed request, since a non-Admin
// never sees this screen at all.
export function UserRow({ user, onRemoved }: { user: SignedInUser; onRemoved: (userId: string) => void }) {
  const [isRemoving, startRemoveTransition] = useTransition();
  const [isTogglingRole, startRoleTransition] = useTransition();
  // Reflects the role change instantly instead of waiting for a navigation to reflect the
  // server's revalidatePath("/usuarios") — the same layered-local-state pattern as UsersList's
  // hiddenUserIds (see ./users-list.tsx).
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);

  const handleRemove = () => {
    startRemoveTransition(async () => {
      const result = await removeUser(user.id);

      if (result.outcome === "ok") {
        onRemoved(user.id);
        return;
      }
      if (result.outcome === "forbidden") {
        toast(ADMIN_ONLY_MESSAGE, { id: REMOVE_TOAST_ID });
        return;
      }
      if (result.outcome === "lastAdmin") {
        toast(LAST_ADMIN_MESSAGE, { id: REMOVE_TOAST_ID });
        return;
      }
      toast(NOT_FOUND_MESSAGE, { id: REMOVE_TOAST_ID });
    });
  };

  // Hacer administrador (ticket #14): always allowed for a known User (grantAdmin never threatens
  // the last-Admin invariant, see src/domain/access/grant-admin.ts), so it submits directly with no
  // confirmation dialog — unlike Quitar administrador below.
  const handleGrantAdmin = () => {
    startRoleTransition(async () => {
      const result = await grantAdmin(user.id);

      if (result.outcome === "ok") {
        setIsAdmin(true);
        toast(`${user.name} ahora es administrador.`, { id: ROLE_TOAST_ID });
        return;
      }
      if (result.outcome === "forbidden") {
        toast(ADMIN_ONLY_MESSAGE, { id: ROLE_TOAST_ID });
        return;
      }
      toast(NOT_FOUND_MESSAGE, { id: ROLE_TOAST_ID });
    });
  };

  // Quitar administrador (ticket #14): confirmed via an AlertDialog, exactly like Eliminar above,
  // since revoking can be refused by the last-Admin guard (validateRevokeAdmin,
  // src/domain/access/revoke-admin.ts) and always ends that User's access to Usuarios itself.
  const handleRevokeAdmin = () => {
    startRoleTransition(async () => {
      const result = await revokeAdmin(user.id);

      if (result.outcome === "ok") {
        setIsAdmin(false);
        toast(`${user.name} ya no es administrador.`, { id: ROLE_TOAST_ID });
        return;
      }
      if (result.outcome === "forbidden") {
        toast(ADMIN_ONLY_MESSAGE, { id: ROLE_TOAST_ID });
        return;
      }
      if (result.outcome === "lastAdmin") {
        toast(LAST_ADMIN_MESSAGE, { id: ROLE_TOAST_ID });
        return;
      }
      toast(NOT_FOUND_MESSAGE, { id: ROLE_TOAST_ID });
    });
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
      <div className="flex flex-col">
        <span className="font-medium">{user.name}</span>
        {isAdmin ? <span className="text-sm text-muted-foreground">Administrador</span> : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
        <Link href={`/usuarios/${user.id}/editar`} className="text-sm text-muted-foreground underline">
          Editar
        </Link>

        {isAdmin ? (
          <AlertDialog>
            <AlertDialogTrigger
              disabled={isTogglingRole}
              className="text-sm text-muted-foreground underline disabled:opacity-50"
            >
              Quitar administrador
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Quitar administrador a {user.name}?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isTogglingRole}>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={isTogglingRole} onClick={handleRevokeAdmin}>
                  Quitar administrador
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <button
            type="button"
            disabled={isTogglingRole}
            onClick={handleGrantAdmin}
            className="text-sm text-muted-foreground underline disabled:opacity-50"
          >
            Hacer administrador
          </button>
        )}

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
