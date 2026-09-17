// How long a cached copy of the Lista de compras may still be served offline (ticket #17 code
// review): ADR-0001 promises that removing a User or changing their PIN ends their access
// immediately, but a cached copy sitting in a phone's own storage can't be reached by that -- the
// device never talks to the server to learn its Session is gone. Clearing the cache the moment a
// device *does* talk to the server and learns it's signed out (see
// src/app/ingresar/clear-offline-cache.tsx) handles the common case; this cap bounds the
// uncommon one -- a device that stays fully offline -- to at most a day instead of leaving it
// open indefinitely. See docs/adr/0001-pin-only-authentication.md.
//
// Mirrored, not imported: public/sw.js is a hand-written script with no build step (see its own
// module doc), so it re-states this same number and rule directly rather than importing this
// module. Keep both in sync if this ever changes.
export const LISTA_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Whether a Lista de compras cached at `cachedAt` is still allowed to be served offline at `now`
// (both epoch milliseconds). Strictly before the cap, mirroring isSessionValid's own "strictly
// before expiresAt" rule (src/domain/access/session.ts). A missing or malformed `cachedAt` (the
// service worker found no timestamp to read) is never fresh -- there is nothing to trust.
export function isCachedListaFresh(cachedAt: number, now: number): boolean {
  if (!Number.isFinite(cachedAt)) return false;
  return now - cachedAt < LISTA_CACHE_MAX_AGE_MS;
}
