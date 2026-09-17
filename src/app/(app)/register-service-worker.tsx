"use client";

import { useEffect } from "react";

// Registers the hand-written service worker (public/sw.js, ticket #17) once per page load.
// Mounted from this route group's own layout, not the root layout (code review, ticket #17): a
// signed-out visitor on /ingresar never registers it at all, so nothing about the offline cache
// exists in their browser until they've actually signed in. The worker itself never touches
// /ingresar or anything but /lista and the shared Next.js static assets (see public/sw.js), so
// this is a defence in depth, not the only thing keeping it scoped -- but it means there is
// nothing to clear for a browser that was never signed in to begin with.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration can fail (an unsupported browser, an insecure context in some setups):
      // reading the Lista de compras offline simply won't work in that case. There's nothing
      // actionable to tell the User -- the rest of the app works identically either way.
    });
  }, []);

  return null;
}
