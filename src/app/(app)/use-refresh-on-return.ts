"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { canTriggerRefresh } from "@/domain/refresh/debounce";
import { canReconcileAfterRefresh } from "@/domain/refresh/mutation-guard";
import { computePullToRefresh, type PullToRefreshState } from "@/domain/refresh/pull-to-refresh";

const IDLE_PULL: PullToRefreshState = { active: false, distance: 0, progress: 0, shouldTrigger: false };

export interface RefreshOnReturn {
  // Attach to the element covering a screen's whole scrollable content, heading included (see
  // pantry-search.tsx and shopping-list-view.tsx) -- never to BottomNav or anything outside it, so
  // the pull gesture can never interfere with the fixed navigation.
  containerRef: RefObject<HTMLDivElement | null>;
  // True for as long as a triggered router.refresh() hasn't yet landed with fresh server data;
  // drives the "Actualizando..." indicator (see refresh-indicator.tsx).
  isRefreshing: boolean;
  // The current pull gesture's geometry, purely for the indicator: see
  // src/domain/refresh/pull-to-refresh.ts.
  pull: PullToRefreshState;
  // Call once, synchronously, whenever the caller sets a local optimistic override in response to
  // a confirmed mutation (a Product hidden, an In Cart flip, ...). See canReconcileAfterRefresh
  // below for why this exists.
  notifyMutation: () => void;
}

// Refresh on return and pull-to-refresh (ticket #16), shared by the Despensa (pantry-search.tsx)
// and the Lista de compras (shopping-list-view.tsx): both bring back fresh Categories and Products
// with router.refresh() alone (Next.js's client-side router refresh, not the Server-Action-only
// next/cache refresh()) -- no realtime subscription, no polling loop -- whenever the app regains
// focus or visibility, or the User pulls down from the top of the screen.
//
// `onRefreshed` runs once the fresh server data from one of THIS hook's own refreshes has actually
// replaced the page's props (the router.refresh() transition settling via useTransition's
// isPending, not the moment the refresh is merely requested), so the caller can reconcile local
// optimistic state -- hidden Products, In Cart overrides -- against it: a stale local override
// could otherwise keep hiding a Product that reappeared under the same id, or fail to hide one this
// session still thinks is visible. But it must skip that reconciliation when a mutation's own
// override was set while this hook's refresh was still in flight (see
// src/domain/refresh/mutation-guard.ts): that override is newer than this refresh's landed data,
// and the mutation's own revalidatePath-driven update -- not this one -- is what will reconcile it
// correctly a moment later. notifyMutation is how the caller reports that a mutation happened.
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
  // See canReconcileAfterRefresh: mutationCount ticks up on every notifyMutation() call,
  // mutationCountAtRefreshStart snapshots it when a hook-triggered refresh starts.
  const mutationCount = useRef(0);
  const mutationCountAtRefreshStart = useRef(0);

  const notifyMutation = useCallback(() => {
    mutationCount.current += 1;
  }, []);

  // Shared by both triggers below so a focus event and pull-to-refresh right after it (or a
  // visibilitychange and a focus firing together on the same tab-switch) don't double the request;
  // see src/domain/refresh/debounce.ts.
  const triggerRefresh = useCallback(() => {
    const now = Date.now();
    if (!canTriggerRefresh(lastRefreshAt.current, now)) return;
    lastRefreshAt.current = now;
    mutationCountAtRefreshStart.current = mutationCount.current;
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router]);

  // The falling edge of isRefreshing (was pending, now isn't) is the actual signal that fresh data
  // landed; onRefreshed must not run merely because a refresh just started, and must not run at all
  // if a mutation's own override was set while this refresh was in flight (see module doc above).
  useEffect(() => {
    if (wasRefreshing.current && !isRefreshing) {
      if (canReconcileAfterRefresh(mutationCountAtRefreshStart.current, mutationCount.current)) {
        onRefreshed();
      }
    }
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
      // Per the Touch Events spec, `touches` can stop including the tracked finger mid-gesture
      // (a second finger lands and the first lifts before touchend/touchcancel fires -- some
      // Android WebViews report this transiently). Treat that exactly like the finger lifting:
      // end the gesture cleanly rather than crashing this listener on a missing clientY.
      const clientY = event.touches[0]?.clientY;
      if (clientY === undefined) {
        endGesture();
        return;
      }
      const deltaY = clientY - touchStartY.current;
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

  return { containerRef, isRefreshing, pull, notifyMutation };
}
