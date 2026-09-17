// Hand-written, dependency-free service worker (ticket #17): caches the Lista de compras --
// GET /lista, plus the shared Next.js JS/CSS bundles needed to render and hydrate it -- so it can
// be read without a connection. Deliberately scoped: no other route is ever cached (the Despensa
// stays out of scope, see the parent spec's Out of Scope list), and /ingresar is never touched,
// so a signed-out User offline is never shown a cached, possibly-stale sign-in screen.
//
// Strategy is network-first, cache-fallback: every matched GET request is always attempted over
// the network first, and only served from the cache when that attempt fails outright (offline, or
// the network is unreachable). A successful network response is never skipped in favor of a
// cached one, so an online User is never shown stale data -- only a genuinely failed request ever
// reads from the cache.
//
// Mutations (Server Actions, always POST) are never touched here at all: the fetch handler below
// returns immediately for anything but GET, so nothing a mutation does is ever cached or served
// from cache. A mutation attempted offline simply fails the normal way; the client-side decision
// in src/domain/offline/mutation-refusal.ts (wired up by src/app/(app)/offline-mutation.ts) turns
// that failure into the Spanish refusal message -- this worker has no part in that.

const CACHE_NAME = "mercado-lista-v1";
const LISTA_PATHNAME = "/lista";

// Only a full navigation (a real page load: opening the installed app, a reload, typing the URL)
// to exactly /lista is ever cached or served from cache -- not a client-side soft navigation into
// it from elsewhere, and not any other route. The static asset check covers the JS/CSS the page
// needs to hydrate; without it the cached HTML would render but nothing on it would be tappable,
// including the offline refusal itself.
function shouldHandle(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (request.mode === "navigate") return url.pathname === LISTA_PATHNAME;
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("install", () => {
  // Activate immediately: this is a read-only cache with no migration to run between versions,
  // so there is nothing to gain by waiting for existing tabs to close first.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only GET is ever cached or served from cache -- see the module doc above.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!shouldHandle(request, url)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only a genuine network success is cached; an HTTP error response (4xx/5xx) still came
        // from a reachable server, so it's passed through as-is without touching the cache --
        // caching an error page would mean serving it again the next time the network is down.
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
