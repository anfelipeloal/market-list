"use client";

import { useEffect } from "react";

// Registers the hand-written service worker (public/sw.js, ticket #17) once per page load.
// Mounted from the root layout so it's active regardless of whether the User is signed in: the
// worker itself never touches /ingresar or anything but /lista and the shared Next.js static
// assets (see public/sw.js), so registering it this early is harmless, and it means the Lista de
// compras is already cacheable the moment a User first opens it.
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
