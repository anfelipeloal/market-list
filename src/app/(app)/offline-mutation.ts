import { shouldRefuseAsOffline } from "@/domain/offline/mutation-refusal";

// Shown for any mutation refused as offline (ticket #17): one home for this copy, exactly like
// shoppingResultMessage (./shopping-messages.ts), so it can't drift between the Lista de compras'
// call sites that use it (./lista/shopping-list-view.tsx).
export const OFFLINE_MUTATION_MESSAGE = "Necesitas conexión para hacer cambios.";

export type MutationAttempt<T> = { outcome: "ok"; value: T } | { outcome: "offline" };

// Wraps a Server Action mutation call so a connection failure is reported the same way wherever
// it can happen: the browser already knowing it's offline (navigator.onLine), and the request
// failing mid-flight even though the browser hadn't noticed yet. Gathering those two signals and
// handing them to the pure decision (src/domain/offline/mutation-refusal.ts, unit-tested) is this
// wrapper's only job -- callers just get back "ok" (with the action's own result) or "offline".
//
// A Server Action call rejects with a TypeError specifically when the underlying fetch itself
// never reached the server (connection dropped mid-flight, DNS failure, ...) -- the Fetch API's
// own signature for a network-layer failure, as distinct from an HTTP error response or an
// application error the action itself threw (see MDN's fetch() rejection behaviour). Anything
// else is a genuine, unexpected error and is rethrown rather than misreported as "offline".
export async function attemptMutation<T>(mutate: () => Promise<T>): Promise<MutationAttempt<T>> {
  const browserOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

  if (shouldRefuseAsOffline({ browserReportsOffline: browserOffline(), requestFailed: false })) {
    return { outcome: "offline" };
  }

  try {
    return { outcome: "ok", value: await mutate() };
  } catch (error) {
    const requestFailed = error instanceof TypeError;
    if (shouldRefuseAsOffline({ browserReportsOffline: browserOffline(), requestFailed })) {
      return { outcome: "offline" };
    }
    throw error;
  }
}
