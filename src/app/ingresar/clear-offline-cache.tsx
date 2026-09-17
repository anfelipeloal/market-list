"use client";

import { useEffect } from "react";

// Landing on /ingresar means this browser is no longer signed in -- a Session expired, a User was
// removed, or their PIN was changed (see src/app/(app)/usuarios/actions.ts#changePin, which
// redirects here directly after ending the acting Admin's own Session). Every path that ends a
// Session funnels through this page: requireUser() (src/lib/session.ts) always redirects here
// rather than returning a distinct "signed out" result, so mounting this once, here, catches every
// case without needing to repeat it at each of them.
//
// ADR-0001 promises that ending a Session ends access immediately, but the offline cache
// (public/sw.js) lives in the browser and the server has no way to reach into it (code review,
// ticket #17) -- so the browser clears it itself the moment it discovers it's signed out, rather
// than relying on the cache's own short age cap (src/domain/offline/cache-freshness.ts) alone.
export function ClearOfflineCache() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_LISTA_CACHE" });
  }, []);

  return null;
}
