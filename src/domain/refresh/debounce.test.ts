import { describe, expect, it } from "vitest";
import { canTriggerRefresh, REFRESH_MIN_INTERVAL_MS } from "./debounce";

const T0 = new Date("2026-01-01T00:00:00.000Z").getTime();

describe("refresh debounce gate", () => {
  it("allows the very first trigger, with no previous refresh recorded", () => {
    expect(canTriggerRefresh(null, T0)).toBe(true);
  });

  it("suppresses a trigger that arrives immediately after the last refresh", () => {
    expect(canTriggerRefresh(T0, T0)).toBe(false);
  });

  it("suppresses a trigger one millisecond short of the minimum interval", () => {
    expect(canTriggerRefresh(T0, T0 + REFRESH_MIN_INTERVAL_MS - 1)).toBe(false);
  });

  it("allows a trigger exactly at the minimum interval", () => {
    expect(canTriggerRefresh(T0, T0 + REFRESH_MIN_INTERVAL_MS)).toBe(true);
  });

  it("allows a trigger well after the minimum interval", () => {
    expect(canTriggerRefresh(T0, T0 + REFRESH_MIN_INTERVAL_MS * 10)).toBe(true);
  });

  it("respects a custom interval instead of the default", () => {
    expect(canTriggerRefresh(T0, T0 + 500, 1000)).toBe(false);
    expect(canTriggerRefresh(T0, T0 + 1000, 1000)).toBe(true);
  });
});
