"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecksIcon, PackageIcon, UsersIcon, type LucideIcon } from "lucide-react";

// `shortLabel`, when set, is what's actually drawn under the icon -- "Lista de compras" doesn't
// fit next to two other tabs at phone width. The full `label` stays the tab's accessible name
// either way (see the Link's aria-label below): a sighted User reads "Lista", a screen reader
// User still hears "Lista de compras".
type Tab = { href: string; label: string; shortLabel?: string; icon: LucideIcon };

const TABS: readonly Tab[] = [
  { href: "/", label: "Despensa", icon: PackageIcon },
  { href: "/lista", label: "Lista de compras", shortLabel: "Lista", icon: ListChecksIcon },
];

// Admin-only (ticket #13): appended to TABS only for an Admin. Hiding it from a non-Admin is only
// a courtesy — the real enforcement is requireAdmin() on /usuarios itself and on every action it
// calls (see src/app/(app)/usuarios/page.tsx and actions.ts), exactly like Reiniciar lista's
// button in ticket #12.
const ADMIN_TAB: Tab = { href: "/usuarios", label: "Usuarios", icon: UsersIcon };

// Fixed to the bottom of every signed-in screen (see src/app/(app)/layout.tsx), so a User can
// always reach the Despensa, the Lista de compras, and (for an Admin) Usuarios in one tap. Not
// shown on /ingresar, which has no shared layout with the signed-in pages.
//
// Icon-above-label tabs, each at least --bottom-nav-height tall (UI redesign: "noticeably taller
// ... and easier to tap", no ticket) -- that custom property (see globals.css) is this bar's own
// contribution to --bottom-nav-offset, the one source of truth it shares with the content
// wrapper's bottom padding (src/app/(app)/layout.tsx) and the Lista de compras' sticky "Terminar
// compra" area (src/app/(app)/lista/shopping-list-view.tsx): change the height here and both
// follow without drifting out of sync again.
export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex w-full max-w-md">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.shortLabel ? tab.label : undefined}
                title={tab.shortLabel ? tab.label : undefined}
                className={`flex min-h-(--bottom-nav-height) w-full flex-col items-center justify-center gap-1 px-2 text-xs font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon aria-hidden className="size-6" strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.shortLabel ?? tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
