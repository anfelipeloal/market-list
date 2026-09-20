import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/session";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { RegisterServiceWorker } from "./register-service-worker";

// Shared layout for every signed-in screen (Despensa, Lista de compras, Usuarios, and their edit
// pages): adds the slim app header naming the signed-in User with a "Cerrar sesión" control, the
// bottom navigation fixed to the bottom of the viewport, and mounts the toast notification used
// for the undo-move flow (ticket #9). /ingresar sits outside this route group and so gets none of
// them: signing in has nowhere to navigate to yet, nothing on that screen triggers a toast, and
// there's no Session yet for a header to name.
//
// Also registers the offline service worker (ticket #17) here, not the root layout (code review):
// only a signed-in User's browser ever registers it, so a signed-out visitor's browser has nothing
// to clear or worry about in the first place -- see register-service-worker.tsx.
export default async function AppLayout({ children }: { children: ReactNode }) {
  // requireUser() is cached per request (see src/lib/session.ts), so every page inside this group
  // calling it too (directly, or via requireAdmin() on /usuarios) costs no extra database round
  // trip: this resolves both isAdmin, to show BottomNav's "Usuarios" entry (ticket #13) only to an
  // Admin, and name, for AppHeader below (no ticket, requested directly).
  const user = await requireUser();

  return (
    <>
      <RegisterServiceWorker />
      {/* Plain document flow, not fixed: it must scroll away with the rest of the page rather
          than carve out its own space the way BottomNav does, and it must sit above the
          pull-to-refresh container each page renders around its own content (pantry-search.tsx,
          shopping-list-view.tsx) without becoming a second scroll container itself -- see
          use-refresh-on-return.ts, which reads window.scrollY. */}
      <AppHeader userName={user.name} />
      {/* pb-(--bottom-nav-offset) keeps content clear of the fixed BottomNav below it -- that
          custom property (see globals.css) is BottomNav's own height plus the device's bottom
          safe-area inset, the one source of truth it shares with BottomNav itself and with the
          sticky "Terminar compra" area (src/app/(app)/lista/shopping-list-view.tsx). */}
      <div className="flex flex-1 flex-col pb-(--bottom-nav-offset)">{children}</div>
      <BottomNav isAdmin={user.isAdmin} />
      <Toaster position="top-center" />
    </>
  );
}
