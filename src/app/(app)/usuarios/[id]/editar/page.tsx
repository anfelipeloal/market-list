import type { Metadata } from "next";
import Link from "next/link";
import { findUserById } from "@/db/users";
import { requireAdmin } from "@/lib/session";
import { EditUserForm } from "./edit-user-form";

export const metadata: Metadata = {
  title: "Renombrar usuario",
};

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  // requireUser() (called inside requireAdmin()) reads the session cookie, which makes this route
  // dynamic (see src/app/(app)/page.tsx). A non-Admin gets the same Spanish refusal as /usuarios
  // itself (see src/app/(app)/usuarios/page.tsx); renameUser (./actions.ts) re-checks this too.
  const admin = await requireAdmin();
  const { id } = await params;

  if (admin.outcome === "forbidden") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <p className="mt-6 text-muted-foreground">Solo un administrador puede administrar usuarios.</p>
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
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Renombrar usuario</h1>
          <EditUserForm userId={user.id} currentName={user.name} />
        </>
      ) : (
        <p className="mt-6 text-muted-foreground">No encontramos ese usuario.</p>
      )}
    </main>
  );
}
