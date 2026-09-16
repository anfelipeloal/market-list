import type { Metadata } from "next";
import { listUsers } from "@/db/users";
import { sortByName } from "@/domain/catalog/names";
import { requireAdmin } from "@/lib/session";
import { NewUserForm } from "./new-user-form";
import { UsersList } from "./users-list";

export const metadata: Metadata = {
  title: "Usuarios",
};

// The Usuarios screen (ticket #13): reachable only by Admins. requireAdmin() is the real
// enforcement — it resolves the acting User server-side and refuses a non-Admin with a typed
// result (see src/lib/session.ts) — this Spanish refusal is what a non-Admin sees if they reach
// this URL directly; the "Usuarios" bottom-nav entry (src/app/(app)/bottom-nav.tsx) only hides
// itself from a non-Admin as a courtesy.
export default async function UsersPage() {
  // requireUser() (called inside requireAdmin()) reads the session cookie, which makes this route
  // dynamic (see src/app/(app)/page.tsx for the same pattern).
  const admin = await requireAdmin();
  if (admin.outcome === "forbidden") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-6 text-muted-foreground">Solo un administrador puede administrar usuarios.</p>
      </main>
    );
  }

  const users = sortByName(await listUsers());

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>

      <NewUserForm />

      {/* Never renders "no Users" here: an Admin is always among them (a Household always has at
          least one, see CONTEXT.md), and they're the one viewing this screen. */}
      <UsersList users={users} />
    </main>
  );
}
