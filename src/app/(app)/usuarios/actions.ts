"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteUser,
  findUserByNormalizedName,
  insertUserOrDuplicate,
  listUsers,
  setUserAdmin,
  updateUserName,
  updateUserPin,
  withAdminGuardLock,
} from "@/db/users";
import { writeUniqueOrDuplicate } from "@/db/pg-errors";
import { validatePinChange } from "@/domain/access/change-pin";
import { validateNewUser } from "@/domain/access/create-user";
import { validateGrantAdmin } from "@/domain/access/grant-admin";
import { isValidId } from "@/domain/ids";
import { validateUserRemoval } from "@/domain/access/remove-user";
import { validateUserRename } from "@/domain/access/rename-user";
import { validateRevokeAdmin } from "@/domain/access/revoke-admin";
import { requireAdmin } from "@/lib/session";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";
import { ADMIN_ONLY_MESSAGE } from "./messages";

export type CreateUserState = { error: string } | undefined;

// Creates a User (ticket #13, Admin-only): a new User is never an Admin and can sign in with their
// PIN right away (see src/db/users.ts#insertUserOrDuplicate, which hashes it with the same keyed
// hash sign-in verifies against). Name and PIN are both validated by the domain core
// (validateNewUser, src/domain/access/create-user.ts) first; the PIN's own uniqueness can only be
// checked by the database (see that function's own comment), so a unique violation on insert is
// mapped to "Ese PIN ya está en uso." here instead.
export async function createUser(_prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const admin = await requireAdmin();
  if (admin.outcome === "forbidden") return { error: ADMIN_ONLY_MESSAGE };

  const rawName = String(formData.get("name") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const existingUsers = await listUsers();
  const result = validateNewUser(rawName, pin, existingUsers);

  if (result.outcome === "emptyName") return { error: "Escribe un nombre." };
  if (result.outcome === "duplicateName") return { error: "Ya existe un usuario con ese nombre." };
  if (result.outcome === "invalidPin") return { error: "El PIN debe tener 4 dígitos." };

  // The domain check above already read the existing Users, but a concurrent create could have
  // won the same name or PIN since; the unique constraints are the final guard (see
  // src/db/pg-errors.ts and insertUserOrDuplicate's own comment for why this can't reuse
  // writeUniqueOrDuplicate as-is).
  const outcome = await insertUserOrDuplicate(result.name, result.normalizedName, result.pin);
  if (outcome.outcome === "duplicateName") return { error: "Ya existe un usuario con ese nombre." };
  if (outcome.outcome === "duplicatePin") return { error: "Ese PIN ya está en uso." };

  revalidatePath("/usuarios");
  return undefined;
}

export type RenameUserState = { error: string } | undefined;

// Renames a User (ticket #13, Admin-only) under the same uniqueness rule as creating one; a User's
// PIN and Admin role are unchanged here (out of scope until ticket #14).
export async function renameUser(_prevState: RenameUserState, formData: FormData): Promise<RenameUserState> {
  const admin = await requireAdmin();
  if (admin.outcome === "forbidden") return { error: ADMIN_ONLY_MESSAGE };

  const userId = String(formData.get("userId") ?? "");
  const rawName = String(formData.get("name") ?? "");
  const existingUsers = await listUsers();
  const result = validateUserRename(userId, rawName, existingUsers);

  if (result.outcome === "notFound") {
    // The id comes from the edit page's own URL, so this only fires if the User was removed by
    // another Admin in the meantime or the request was tampered with.
    return { error: "No encontramos ese usuario." };
  }
  if (result.outcome === "emptyName") return { error: "Escribe un nombre." };
  if (result.outcome === "duplicateName") return { error: "Ya existe un usuario con ese nombre." };

  // Same race guard as editCategory (src/app/(app)/actions.ts): a concurrent rename could have won
  // the same name since the domain check read the existing Users.
  const outcome = await writeUniqueOrDuplicate({
    write: () => updateUserName(result.id, result.name, result.normalizedName),
    findExisting: () => findUserByNormalizedName(result.normalizedName),
  });
  if (outcome.outcome === "duplicate") return { error: "Ya existe un usuario con ese nombre." };

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export type RemoveUserResult =
  | { outcome: "ok" }
  | { outcome: "notFound" }
  | { outcome: "lastAdmin" }
  | { outcome: "forbidden" };

// Removes a User (ticket #13, Admin-only), ending their access immediately: deleting the row
// cascades to their Sessions (see src/db/schema.ts, sessions.userId onDelete: "cascade"), so their
// very next request finds no valid Session and is sent back to /ingresar (src/lib/session.ts,
// requireUser). Refused when the User is the only Admin (validateUserRemoval,
// src/domain/access/remove-user.ts), so the Household is never left without one. Called directly
// from the confirmation dialog (see src/app/(app)/usuarios/user-row.tsx), not through a form —
// exactly like resetShoppingList() in src/app/(app)/shopping-actions.ts.
//
// The read (listUsers), the decision (validateUserRemoval) and the write (deleteUser) all run
// inside withAdminGuardLock's transaction-scoped advisory lock (src/db/users.ts): without it, two
// Admins removing each other at nearly the same moment could each read the same "two Admins"
// snapshot before either delete commits, each decide their own removal is safe, and both
// deletes commit — leaving the Household with zero Admins. The lock serializes that sequence so
// the second remover's re-read (inside the SAME transaction machinery, just its own later turn)
// always sees the first remover's already-committed delete.
export async function removeUser(userId: string): Promise<RemoveUserResult> {
  const admin = await requireAdmin();
  if (admin.outcome === "forbidden") return { outcome: "forbidden" };

  const result = await withAdminGuardLock(async (tx) => {
    const existingUsers = await listUsers(tx);
    const decision = validateUserRemoval(existingUsers, userId);
    if (decision.outcome === "notFound") return { outcome: "notFound" } as const;
    if (decision.outcome === "lastAdmin") return { outcome: "lastAdmin" } as const;

    const deleted = await deleteUser(userId, tx);
    if (!deleted) {
      // The decision above just confirmed this User exists; only a concurrent removal of the same
      // User committing between that read and this delete (impossible for a DIFFERENT User's
      // removal, which the lock now serializes, but still possible if the very same id were
      // somehow requested twice) reaches here.
      return { outcome: "notFound" } as const;
    }
    return { outcome: "ok" } as const;
  });

  if (result.outcome === "ok") revalidatePath("/usuarios");
  return result;
}

export type ChangePinResult =
  | { outcome: "ok" }
  | { outcome: "notFound" }
  | { outcome: "invalidPin" }
  | { outcome: "duplicatePin" }
  | { outcome: "forbidden" };

// Changes a User's PIN (ticket #14, Admin-only), including the acting Admin's own. Name and role
// are untouched (see validateUserRename above for those). Format is validated by the domain core
// (validatePinChange, src/domain/access/change-pin.ts) first; the PIN's own uniqueness can only be
// checked by the database (see that function's own comment), so a unique violation is mapped to
// "Ese PIN ya está en uso." here — same message and same reasoning as createUser above.
//
// updateUserPin (src/db/users.ts) ends every one of that User's Sessions in the same transaction
// as the PIN write, so access under the old PIN stops immediately (CONTEXT.md's Change PIN). When
// the changed User is the one currently signed in, their own session row is one of the ones just
// deleted: their next request would find no valid Session and be redirected to /ingresar anyway
// (src/lib/session.ts#requireUser), but clearing the cookie and redirecting here — rather than
// returning "ok" to a page they can no longer use — sends them there immediately instead of on
// their next accidental navigation. ChangePinForm (./[id]/editar/change-pin-form.tsx) warns about
// this in a confirmation dialog before ever calling this action.
export async function changePin(userId: string, newPin: string): Promise<ChangePinResult> {
  const admin = await requireAdmin();
  if (admin.outcome === "forbidden") return { outcome: "forbidden" };
  if (!isValidId(userId)) return { outcome: "notFound" };

  const existingUsers = await listUsers();
  const decision = validatePinChange(userId, newPin, existingUsers);
  if (decision.outcome === "notFound") return { outcome: "notFound" };
  if (decision.outcome === "invalidPin") return { outcome: "invalidPin" };

  const outcome = await updateUserPin(decision.userId, decision.pin);
  if (outcome.outcome === "duplicatePin") return { outcome: "duplicatePin" };
  if (outcome.outcome === "notFound") return { outcome: "notFound" };

  revalidatePath("/usuarios");

  if (admin.user.id === userId) {
    (await cookies()).delete(SESSION_COOKIE_NAME);
    redirect("/ingresar");
  }

  return { outcome: "ok" };
}

export type GrantAdminResult = { outcome: "ok" } | { outcome: "notFound" } | { outcome: "forbidden" };

// Makes a User an Admin (ticket #14, Admin-only): always allowed for a known User
// (validateGrantAdmin, src/domain/access/grant-admin.ts), since granting can never leave the
// Household without one. Runs inside withAdminGuardLock for the same reason removeUser does (see
// that function's own comment): a grant racing a demotion or removal must never interleave with
// either. Unlike changePin, this never touches Sessions (see CONTEXT.md — only Change PIN and
// removal end them).
export async function grantAdmin(userId: string): Promise<GrantAdminResult> {
  const admin = await requireAdmin();
  if (admin.outcome === "forbidden") return { outcome: "forbidden" };
  if (!isValidId(userId)) return { outcome: "notFound" };

  const result = await withAdminGuardLock(async (tx) => {
    const existingUsers = await listUsers(tx);
    const decision = validateGrantAdmin(existingUsers, userId);
    if (decision.outcome === "notFound") return { outcome: "notFound" } as const;

    const updated = await setUserAdmin(userId, true, tx);
    if (!updated) return { outcome: "notFound" } as const;
    return { outcome: "ok" } as const;
  });

  if (result.outcome === "ok") revalidatePath("/usuarios");
  return result;
}

export type RevokeAdminResult =
  | { outcome: "ok" }
  | { outcome: "notFound" }
  | { outcome: "lastAdmin" }
  | { outcome: "forbidden" };

// Removes the Admin role from a User (ticket #14, Admin-only): refused when the target is the
// Household's only Admin (validateRevokeAdmin, src/domain/access/revoke-admin.ts), the same
// invariant removeUser enforces for deletion. The read (listUsers), the decision and the write
// (setUserAdmin) all run inside withAdminGuardLock's transaction-scoped advisory lock for exactly
// the reason documented on that helper (src/db/users.ts): a demotion racing a removal, or two
// demotions racing each other, is the same "zero Admins" failure as two concurrent removals.
export async function revokeAdmin(userId: string): Promise<RevokeAdminResult> {
  const admin = await requireAdmin();
  if (admin.outcome === "forbidden") return { outcome: "forbidden" };
  if (!isValidId(userId)) return { outcome: "notFound" };

  const result = await withAdminGuardLock(async (tx) => {
    const existingUsers = await listUsers(tx);
    const decision = validateRevokeAdmin(existingUsers, userId);
    if (decision.outcome === "notFound") return { outcome: "notFound" } as const;
    if (decision.outcome === "lastAdmin") return { outcome: "lastAdmin" } as const;

    const updated = await setUserAdmin(userId, false, tx);
    if (!updated) return { outcome: "notFound" } as const;
    return { outcome: "ok" } as const;
  });

  if (result.outcome === "ok") revalidatePath("/usuarios");
  return result;
}
