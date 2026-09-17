import { describe, expect, it } from "vitest";
import { isCachedListaFresh, LISTA_CACHE_MAX_AGE_MS } from "./cache-freshness";

describe("deciding whether a cached Lista de compras is still fresh enough to serve offline (ticket #17 code review)", () => {
  it("is fresh the instant it was cached", () => {
    expect(isCachedListaFresh(1_000, 1_000)).toBe(true);
  });

  it("is fresh a moment before the cap", () => {
    expect(isCachedListaFresh(0, LISTA_CACHE_MAX_AGE_MS - 1)).toBe(true);
  });

  it("is no longer fresh exactly at the cap", () => {
    expect(isCachedListaFresh(0, LISTA_CACHE_MAX_AGE_MS)).toBe(false);
  });

  it("is no longer fresh well past the cap", () => {
    expect(isCachedListaFresh(0, LISTA_CACHE_MAX_AGE_MS + 60_000)).toBe(false);
  });

  it("is never fresh when the cached time itself is missing or malformed", () => {
    expect(isCachedListaFresh(Number.NaN, 1_000)).toBe(false);
  });
});
