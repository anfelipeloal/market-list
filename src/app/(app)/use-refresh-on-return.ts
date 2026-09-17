"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { canTriggerRefresh } from "@/domain/refresh-debounce";
import { computePullToRefresh, type PullToRefreshState } from "@/domain/pull-to-refresh";

const IDLE_PULL: PullToRefreshState = { active: false, distance: 0, progress: 0, shouldTrigger: false };

export interface RefreshOnReturn {
  // Attach to the element wrapping a screen's own scrollable content (see pantry-search.tsx and
  // shopping-list-view.tsx) -- never to BottomNav or anything outside it, so the pull gesture can
  // never interfere with the fixed navigation.
  containerRef: RefObject<HTMLDivElement | null>;
  // True for as long as a triggered router.refresh() hasn't yet landed with fresh server data;
  // drives the "Actualizando..." indicator (see refresh-indicator.tsx).
  isRefreshing: boolean;
  // The current pull gesture's geometry, purely for the indicator: see src/domain/pull-to-refresh.ts.
  pull: PullToRefreshState;
}

// Refresh on return and pull-to-refresh (ticket #16), shared by the Despensa (pantry-search.tsx)
// and the Lista de compras (shopping-list-view.tsx): both bring back fresh Categories and Products
// with router.refresh() alone (Next.js's client-side router refresh, not the Server-Action-only
// next/cache refresh()) -- no realtime subscription, no polling loop -- whenever the app regains
// focus or visibility, or the User pulls down from the top of the screen.
//
// `onRefreshed` runs once the fresh server data has actually replaced the page's props (the
// router.refresh() transition settling via useTransition's isPending, not the moment the refresh
// is merely requested), so the caller can reconcile local optimistic state -- hidden Products, In
// Cart overrides -- against it: a stale local override could otherwise keep hiding a Product that
// reappeared under the same id (e.g. it was Finished-Trip away by this session earlier, then moved
// back onto the Shopping List by anyone before this refresh), or fail to hide one this session
// still thinks is visible. See pantry-search.tsx and shopping-list-view.tsx for exactly what each
// reconciles.
export function useRefreshOnReturn(onRefreshed: () => void): RefreshOnReturn {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const lastRefreshAt = useRef<number | null>(null);
  const wasRefreshing = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState<PullToRefreshState>(IDLE_PULL);
  // Mirrors `pull` for reading inside endGesture below without making it a dependency: React
  // forbids starting a transition from inside a state updater function (calling triggerRefresh
  // from inside setPull's updater throws "Cannot call startTransition while rendering"), so
  // endGesture must decide whether to refresh from a plain value read outside of any updater.
  const pullRef = useRef<PullToRefreshState>(IDLE_PULL);

  // Shared by both triggers below so a focus event and pull-to-refresh right after it (or a
  // visibilitychange and a focus firing together on the same tab-switch) don't double the request;
  // see src/domain/refresh-debounce.ts.
  const triggerRefresh = useCallback(() => {
    const now = Date.now();
    if (!canTriggerRefresh(lastRefreshAt.current, now)) return;
    lastRefreshAt.current = now;
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router]);

  // The falling edge of isRefreshing (was pending, now isn't) is the actual signal that fresh data
  // landed; onRefreshed must not run merely because a refresh just started.
  useEffect(() => {
    if (wasRefreshing.current && !isRefreshing) onRefreshed();
    wasRefreshing.current = isRefreshing;
  }, [isRefreshing, onRefreshed]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") triggerRefresh();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", triggerRefresh);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", triggerRefresh);
    };
  }, [triggerRefresh]);

  // Native listeners (not React's onTouch* props) because touchmove must be able to call
  // preventDefault: React attaches touch listeners passively by default, which silently ignores
  // preventDefault. Scoped to the container element, not window or document, so dragging anywhere
  // outside a screen's own content (BottomNav included) is never affected.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(event: TouchEvent) {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent) {
      if (touchStartY.current === null) return;
      const deltaY = event.touches[0].clientY - touchStartY.current;
      const next = computePullToRefresh(window.scrollY, deltaY);
      // preventDefault only while actively pulling: this both stops the page from also scrolling
      // while the indicator is being dragged out, and suppresses the browser's own native
      // pull-to-refresh so the two never fire together. Normal scrolling elsewhere is untouched.
      if (next.active) event.preventDefault();
      pullRef.current = next;
      setPull(next);
    }

    function endGesture() {
      touchStartY.current = null;
      const shouldTrigger = pullRef.current.shouldTrigger;
      pullRef.current = IDLE_PULL;
      setPull(IDLE_PULL);
      // Called after (not inside) setPull: triggerRefresh starts a transition, and React forbids
      // starting one from within a state updater function.
      if (shouldTrigger) triggerRefresh();
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", endGesture);
    container.addEventListener("touchcancel", endGesture);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", endGesture);
      container.removeEventListener("touchcancel", endGesture);
    };
  }, [triggerRefresh]);

  return { containerRef, isRefreshing, pull };
}
