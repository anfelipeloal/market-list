"use client";

import { useState, useTransition } from "react";
import { PencilIcon, ShieldMinusIcon, ShieldPlusIcon } from "lucide-react";
import { toast } from "sonner";
import type { SignedInUser } from "@/db/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ConfirmDeleteButton } from "@/app/(app)/confirm-delete-button";
import { IconButton, IconLink } from "@/app/(app)/icon-control";
import { grantAdmin, removeUser, revokeAdmin } from "./actions";
import { userActionRefusalMessage } from "./messages";

const REMOVE_TOAST_ID = "remove-user";
const ROLE_TOAST_ID = "toggle-admin-role";

// One row of the Usuarios list (ticket #13, extended by #14): a link to edit this User (rename,
// Change PIN), a role toggle ("Hacer administrador" / "Quitar administrador"), and an "Eliminar"
// button (ConfirmDeleteButton, src/app/(app)/confirm-delete-button.tsx — shared with ticket #15's
// Category/Product delete buttons). Every action's own server function (removeUser, grantAdmin,
// revokeAdmin, all in ./actions.ts) enforces the Admin check — and, for removeUser/revokeAdmin, the
// last-Admin guard — server-side regardless of what renders here: "forbidden" is only reachable in
// practice through a tampered/replayed request, since a non-Admin never sees this screen at all.
export function UserRow({ user, onRemoved }: { user: SignedInUser; onRemoved: (userId: string) => void }) {
  const [isTogglingRole, startRoleTransition] = useTransition();
  // Reflects the role change instantly instead of waiting for a navigation to reflect the
  // server's revalidatePath("/usuarios") — the same layered-local-state pattern as UsersList's
  // hiddenUserIds (see ./users-list.tsx).
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);

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
      toast(userActionRefusalMessage(result.outcome), { id: ROLE_TOAST_ID });
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
      toast(userActionRefusalMessage(result.outcome), { id: ROLE_TOAST_ID });
    });
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
      <div className="flex flex-col">
        <span className="font-medium">{user.name}</span>
        {isAdmin ? <span className="text-sm text-muted-foreground">Administrador</span> : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        <IconLink href={`/usuarios/${user.id}/editar`} icon={PencilIcon} label={`Editar ${user.name}`} />

        {isAdmin ? (
          <AlertDialog>
            <AlertDialogTrigger
              disabled={isTogglingRole}
              render={<IconButton icon={ShieldMinusIcon} label={`Quitar administrador a ${user.name}`} />}
            />
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
          <IconButton
            icon={ShieldPlusIcon}
            label={`Hacer administrador a ${user.name}`}
            disabled={isTogglingRole}
            onClick={handleGrantAdmin}
          />
        )}

        <ConfirmDeleteButton
          label={`Eliminar a ${user.name}`}
          title={`¿Eliminar a ${user.name}?`}
          description={`${user.name} perderá acceso a la aplicación de inmediato.`}
          toastId={REMOVE_TOAST_ID}
          action={() => removeUser(user.id)}
          refusalMessage={userActionRefusalMessage}
          onSuccess={() => onRemoved(user.id)}
        />
      </div>
    </li>
  );
}
