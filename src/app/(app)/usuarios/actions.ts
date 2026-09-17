"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteUser, findUserByNormalizedName, insertUserOrDuplicate, listUsers, updateUserName, withAdminGuardLock } from "@/db/users";
import { writeUniqueOrDuplicate } from "@/db/pg-errors";
import { validateNewUser } from "@/domain/access/create-user";
import { validateUserRemoval } from "@/domain/access/remove-user";
import { validateUserRename } from "@/domain/access/rename-user";
import { requireAdmin } from "@/lib/session";
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
