import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "./bottom-nav";

// Shared layout for every signed-in screen (Despensa, Lista de compras, and their edit pages):
// adds the bottom navigation, fixed to the bottom of the viewport, and mounts the toast
// notification used for the undo-move flow (ticket #9). /ingresar sits outside this route group
// and so gets neither: signing in has nowhere to navigate to yet, and nothing on that screen
// triggers a toast.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* pb-24 keeps content clear of the fixed BottomNav below it. */}
      <div className="flex flex-1 flex-col pb-24">{children}</div>
      <BottomNav />
      <Toaster position="top-center" />
    </>
  );
}
