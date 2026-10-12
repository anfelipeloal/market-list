import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Route-level loading UI for the bottom-navigation screens (each tab's loading.tsx). Those routes
// are dynamic (they read the session cookie), so Next.js cannot prefetch them; with a loading.tsx
// it prefetches this skeleton instead, which makes the tab switch instant while the real data
// streams in. The heading is real text, so it does not jump when the content replaces the
// skeleton, and the pulse respects the User's reduced-motion setting.
export function PageSkeleton({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6" aria-busy="true">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p role="status" className="sr-only">
        Cargando…
      </p>
      <div aria-hidden className="motion-safe:animate-pulse">
        {children}
      </div>
    </main>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-muted", className)} />;
}

// A card with a heading line and a few rows, the shape every list on these screens shares.
export function SkeletonCard({ rows, className }: { rows: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="border-b px-4 py-4">
        <SkeletonBlock className="h-5 w-1/3" />
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        {Array.from({ length: rows }, (_, index) => (
          <SkeletonBlock key={index} className="h-(--control-height) w-full" />
        ))}
      </div>
    </div>
  );
}
