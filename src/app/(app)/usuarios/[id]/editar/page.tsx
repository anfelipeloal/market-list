import type { Metadata } from "next";
import Link from "next/link";
import { findUserById } from "@/db/users";
import { requireAdmin } from "@/lib/session";
import { ADMIN_ONLY_MESSAGE, USER_NOT_FOUND_MESSAGE } from "@/app/(app)/usuarios/messages";
import { ChangePinForm } from "./change-pin-form";
import { EditUserForm } from "./edit-user-form";

export const metadata: Metadata = {
  title: "Editar usuario",
};

// Holds both of a User's per-User edit actions (ticket #13's rename, ticket #14's Change PIN):
// extending this one screen keeps every "edit this User" action in one place instead of adding a
// route per action (see the brief's "extend... the per-User edit page rather than adding new
// routes").
export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  // requireUser() (called inside requireAdmin()) reads the session cookie, which makes this route
  // dynamic (see src/app/(app)/page.tsx). A non-Admin gets the same Spanish refusal as /usuarios
  // itself (see src/app/(app)/usuarios/page.tsx); renameUser and changePin (./actions.ts,
  // ../actions.ts) re-check this too.
  const admin = await requireAdmin();
  const { id } = await params;

  if (admin.outcome === "forbidden") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <p className="mt-6 text-muted-foreground">{ADMIN_ONLY_MESSAGE}</p>
      </main>
    );
  }

  const user = await findUserById(id);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Link href="/usuarios" className="text-sm text-muted-foreground underline">
        Volver a Usuarios
      </Link>

      {user ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Editar usuario</h1>
          <EditUserForm userId={user.id} currentName={user.name} />
          {/* isSelf: whether the Admin editing this User is themself, which ChangePinForm needs to
              decide whether to warn about ending their own session before submitting (ticket #14's
              decision — see that component's own comment). */}
          <ChangePinForm userId={user.id} isSelf={user.id === admin.user.id} />
        </>
      ) : (
        <p className="mt-6 text-muted-foreground">{USER_NOT_FOUND_MESSAGE}</p>
      )}
    </main>
  );
}
