export type ConnectivityCheck = {
  // navigator.onLine === false at the moment the mutation was attempted.
  browserReportsOffline: boolean;
  // The mutation's own request never reached the server (a network-layer failure -- see
  // src/app/(app)/offline-mutation.ts for how the caller tells this apart from an HTTP error
  // response or an application error the action itself threw).
  requestFailed: boolean;
};

// Whether a mutation attempt should be refused as "no connection" (ticket #17) rather than shown
// as if it might have worked. Two independent signals feed this because neither is reliable
// alone: navigator.onLine can still read true right after a connection drops -- the OS hasn't
// noticed yet -- so a request that failed to reach the server at all is just as much "offline" as
// the browser proactively reporting it. Either one is enough on its own.
export function shouldRefuseAsOffline(check: ConnectivityCheck): boolean {
  return check.browserReportsOffline || check.requestFailed;
}
