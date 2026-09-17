"use client";

import { useSyncExternalStore } from "react";

// Tracks the browser's own connectivity signal (ticket #17): drives the Lista de compras'
// "Sin conexión..." indication. This is a UI signal, not the mutation-refusal decision (see
// src/domain/offline/mutation-refusal.ts), which also accounts for a request failing mid-flight
// before the browser has noticed -- this hook only mirrors navigator.onLine and the online/offline
// window events.
//
// useSyncExternalStore, not useState+useEffect: navigator.onLine is state that lives outside
// React, so this is exactly what the hook is for -- it re-renders on every "online"/"offline"
// event without a manual effect that would set state on mount (Next's react-hooks/set-state-in-effect
// lint rule flags exactly that pattern), and it supplies a fixed server snapshot so hydration never
// mismatches on a signal the server can't read.
function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot(): boolean {
  return !navigator.onLine;
}

// The server has no connectivity of its own to report; assume online so the first paint matches
// what a signed-in User almost always sees, and let the real value take over immediately after
// hydration once getSnapshot can run.
function getServerSnapshot(): boolean {
  return false;
}

export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
