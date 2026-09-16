import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/session";
import { BottomNav } from "./bottom-nav";

// Shared layout for every signed-in screen (Despensa, Lista de compras, Usuarios, and their edit
// pages): adds the bottom navigation, fixed to the bottom of the viewport, and mounts the toast
// notification used for the undo-move flow (ticket #9). /ingresar sits outside this route group
// and so gets neither: signing in has nowhere to navigate to yet, and nothing on that screen
// triggers a toast.
export default async function AppLayout({ children }: { children: ReactNode }) {
  // requireUser() is cached per request (see src/lib/session.ts), so every page inside this group
  // calling it too (directly, or via requireAdmin() on /usuarios) costs no extra database round
  // trip: this only resolves isAdmin, to show BottomNav's "Usuarios" entry (ticket #13) only to an
  // Admin.
  const user = await requireUser();

  return (
    <>
      {/* pb-24 keeps content clear of the fixed BottomNav below it. */}
      <div className="flex flex-1 flex-col pb-24">{children}</div>
      <BottomNav isAdmin={user.isAdmin} />
      <Toaster position="top-center" />
    </>
  );
}
