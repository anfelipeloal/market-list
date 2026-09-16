"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Despensa" },
  { href: "/lista", label: "Lista de compras" },
] as const;

// Admin-only (ticket #13): appended to TABS only for an Admin. Hiding it from a non-Admin is only
// a courtesy — the real enforcement is requireAdmin() on /usuarios itself and on every action it
// calls (see src/app/(app)/usuarios/page.tsx and actions.ts), exactly like Reiniciar lista's
// button in ticket #12.
const ADMIN_TAB = { href: "/usuarios", label: "Usuarios" } as const;

// Fixed to the bottom of every signed-in screen (see src/app/(app)/layout.tsx), so a User can
// always reach the Despensa, the Lista de compras, and (for an Admin) Usuarios in one tap. Not
// shown on /ingresar, which has no shared layout with the signed-in pages.
export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex w-full max-w-md">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-2 py-3 text-sm font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
