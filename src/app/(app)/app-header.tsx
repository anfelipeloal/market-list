import { LogOutIcon } from "lucide-react";
import { IconButton } from "./icon-control";
import { signOut } from "./session-actions";

// The slim, app-wide header AppLayout renders once above every signed-in screen (no ticket,
// requested directly -- see src/app/(app)/layout.tsx), never on /ingresar. The app identifies a
// User only by their PIN (CONTEXT.md), so on a shared phone this is the only place that says whose
// Session is actually open right now.
//
// Deliberately quiet -- small, muted name text, no border or background of its own -- so it never
// competes with each page's own <h1> just below it (Despensa, Lista de compras, Usuarios). The
// trailing control reuses --control-height (globals.css), the same tap-target height every input,
// select and button in the app already shares, rather than inventing another size for one button.
//
// "Cerrar sesión" is a plain <form> submit, not a Client Component onClick: signOut()
// (./session-actions.ts) always ends in a redirect, so there is nothing to show while it runs and
// no local state to hold -- a form posting directly to a Server Action is the smaller, more
// resilient shape (see the Next.js Mutating Data guide's Forms section). No confirmation dialog
// and no toast: see session-actions.ts for why.
export function AppHeader({ userName }: { userName: string }) {
  return (
    <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-3">
      <span className="truncate text-sm text-muted-foreground">{userName}</span>
      <form action={signOut}>
        <IconButton type="submit" icon={LogOutIcon} label="Cerrar sesión" />
      </form>
    </header>
  );
}
