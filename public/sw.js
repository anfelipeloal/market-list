// Hand-written, dependency-free service worker (ticket #17): caches the Lista de compras --
// GET /lista, plus the shared Next.js JS/CSS bundles needed to render and hydrate it -- so it can
// be read without a connection. Deliberately scoped: no other route is ever cached (the Despensa
// stays out of scope, see the parent spec's Out of Scope list), and /ingresar is never touched,
// so a signed-out User offline is never shown a cached, possibly-stale sign-in screen. Registered
// only from the signed-in (app) layout (src/app/(app)/register-service-worker.tsx), never the
// root layout, so a signed-out visitor never registers it in the first place.
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
//
// Session revocation (code review, ticket #17): ADR-0001 promises that removing a User or
// changing their PIN ends their access immediately, but this cache lives in the browser and the
// server has no way to reach into it. Two independent bounds instead of trusting either alone:
// (1) the page tells this worker to drop the cache the moment it discovers it's signed out (the
// "message" listener below, triggered from src/app/ingresar/clear-offline-cache.tsx -- every path
// that ends a Session lands on /ingresar, since requireUser() always redirects there rather than
// returning a distinct "signed out" result), and (2) a cached copy older than
// LISTA_CACHE_MAX_AGE_MS is never served at all, however this worker learns that (or doesn't).

const CACHE_NAME = "mercado-lista-v1";
const LISTA_PATHNAME = "/lista";
const CACHED_AT_HEADER = "x-mercado-cached-at";

// Mirrors src/domain/offline/cache-freshness.ts's LISTA_CACHE_MAX_AGE_MS/isCachedListaFresh --
// that module is the tested spec; this hand-written worker (no build step, no imports) re-states
// the same one-line rule here. Keep both in sync if this ever changes.
const LISTA_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isCachedListaFresh(cachedAt, now) {
  return Number.isFinite(cachedAt) && now - cachedAt < LISTA_CACHE_MAX_AGE_MS;
}

// Shown instead of the React banner (src/app/(app)/lista/shopping-list-view.tsx) whenever this
// worker itself serves the cached page -- that banner is React state that only appears once
// hydration has actually run, so a cold "open the app offline" load would otherwise show the
// Shopping List with no indication at all until (or unless) hydration completes. Same text and
// classes as the React version so the swap (see below) is invisible; the data-mercado-sw-banner
// marker is how the React component finds and removes this one once it takes over, so the two can
// never both be showing at once.
const OFFLINE_BANNER_HTML =
  '<p data-mercado-sw-banner role="status" class="mt-4 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">Sin conexión. Estás viendo la última lista guardada.</p>';
const BANNER_INSERTION_MARKER = "</h1>";

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

// Stamps a response with when it's being cached, so a later offline read can judge its age (see
// isCachedListaFresh above). Headers are otherwise copied through unchanged.
function withCachedAtHeader(response) {
  const headers = new Headers(response.headers);
  headers.set(CACHED_AT_HEADER, String(Date.now()));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Inserts OFFLINE_BANNER_HTML right after the page's own <h1> (the only one on /lista -- see
// shopping-list-view.tsx) so it reads in the same position the React banner would render in.
// Content-Length is dropped rather than corrected: the fetch/cache layer recomputes it from the
// actual bytes it sends, and leaving the old, now-wrong value in place risks the body being
// truncated to it.
async function injectOfflineBanner(cachedResponse) {
  const html = await cachedResponse.text();
  const markerIndex = html.indexOf(BANNER_INSERTION_MARKER);
  const withBanner =
    markerIndex === -1
      ? html
      : html.slice(0, markerIndex + BANNER_INSERTION_MARKER.length) +
        OFFLINE_BANNER_HTML +
        html.slice(markerIndex + BANNER_INSERTION_MARKER.length);

  const headers = new Headers(cachedResponse.headers);
  headers.delete("content-length");
  return new Response(withBanner, {
    status: cachedResponse.status,
    statusText: cachedResponse.statusText,
    headers,
  });
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

// Told by the page to drop the cache the moment it learns this browser is signed out (see the
// module doc above and src/app/ingresar/clear-offline-cache.tsx). Deleting the whole cache, not
// just the /lista entry, is deliberate: it's the same one cache this worker ever writes to.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_LISTA_CACHE") {
    event.waitUntil(caches.delete(CACHE_NAME));
  }
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
          const tagged = withCachedAtHeader(response.clone());
          caches.open(CACHE_NAME).then((cache) => cache.put(request, tagged));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (!cached) {
          // Nothing to fall back to: rethrow so the browser shows its own normal offline page
          // instead of this handler resolving to nothing.
          throw new Error("offline and nothing cached for this request");
        }

        // The freshness cap only applies to the Lista de compras document itself -- the
        // Household data ADR-0001's revocation promise is actually about. The static JS/CSS
        // bundles cached alongside it are immutable, content-hashed build assets with nothing
        // to leak, so they're served regardless of age.
        if (request.mode === "navigate") {
          const cachedAt = Number(cached.headers.get(CACHED_AT_HEADER));
          if (!isCachedListaFresh(cachedAt, Date.now())) {
            throw new Error("cached Lista de compras is older than LISTA_CACHE_MAX_AGE_MS");
          }
          return injectOfflineBanner(cached);
        }

        return cached;
      }),
  );
});
