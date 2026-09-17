// Refresh on return and pull-to-refresh (ticket #16) both bring fresh data by calling
// router.refresh() from a Client Component (see src/app/(app)/use-refresh-on-return.ts) instead of
// a realtime subscription or a polling loop. Both triggers funnel through this gate first:
// visibilitychange and focus fire together on most tab/app switches (a "tab-switch storm"), and a
// User who pulls to refresh moments after the app already refreshed on its own would otherwise
// double the request. `now` and `lastRefreshAt` are plain millisecond timestamps the caller reads
// itself (Date.now()) and remembers, so this decision has no dependency on a timer, the DOM, or
// the wall clock beyond what it's handed -- the same shape as src/domain/access/lockout.ts's own
// window-based decisions.
export const REFRESH_MIN_INTERVAL_MS = 3000;

// Whether a refresh trigger at `now` should actually run a refresh. The very first trigger
// (lastRefreshAt is null: nothing has refreshed yet this session) is always allowed. After that, a
// trigger is allowed once at least `minIntervalMs` has elapsed since the last accepted one, and
// suppressed before that; the boundary itself (elapsed === minIntervalMs) is allowed, matching the
// ">=" a caller would expect from "at least N seconds apart".
export function canTriggerRefresh(
  lastRefreshAt: number | null,
  now: number,
  minIntervalMs: number = REFRESH_MIN_INTERVAL_MS,
): boolean {
  if (lastRefreshAt === null) return true;
  return now - lastRefreshAt >= minIntervalMs;
}
