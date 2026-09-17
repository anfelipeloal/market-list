"use client";

import { Loader2Icon } from "lucide-react";
import type { PullToRefreshState } from "@/domain/pull-to-refresh";

// The visible + announced feedback for ticket #16's refresh on return and pull-to-refresh, shared
// by pantry-search.tsx and shopping-list-view.tsx. Idle shows nothing at all -- the Spanish copy
// decision is nothing permanent on screen when idle. While pulling (before release), the space
// reveals with the gesture's own distance so the User sees the pull is registering; that part is
// purely visual (aria-hidden) since nothing has happened yet to announce. Once a refresh is
// actually running -- from pull-to-refresh releasing past the threshold, or from focus/visibility
// alone, which shows no pull at all -- role="status" announces "Actualizando..." for a screen
// reader User who can't see the spinner.
export function RefreshIndicator({ isRefreshing, pull }: { isRefreshing: boolean; pull: PullToRefreshState }) {
  const height = isRefreshing ? 40 : pull.distance;

  return (
    <div style={{ height }} className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out">
      <Loader2Icon
        aria-hidden="true"
        className={`size-5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
        style={isRefreshing ? undefined : { opacity: pull.progress }}
      />
      <p role="status" className="sr-only">
        {isRefreshing ? "Actualizando…" : ""}
      </p>
    </div>
  );
}
