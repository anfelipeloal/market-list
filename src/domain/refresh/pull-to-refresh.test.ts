import { describe, expect, it } from "vitest";
import { computePullToRefresh, PULL_TO_REFRESH_THRESHOLD_PX } from "./pull-to-refresh";

const IDLE = { active: false, distance: 0, progress: 0, shouldTrigger: false };

describe("pull-to-refresh geometry", () => {
  it("is idle when the screen isn't scrolled to the top", () => {
    expect(computePullToRefresh(10, 100)).toEqual(IDLE);
  });

  it("ignores upward movement even at the top", () => {
    expect(computePullToRefresh(0, -20)).toEqual(IDLE);
  });

  it("ignores a touch that hasn't moved", () => {
    expect(computePullToRefresh(0, 0)).toEqual(IDLE);
  });

  it("is an active pull below the threshold, but does not yet trigger", () => {
    const result = computePullToRefresh(0, 20);
    expect(result.active).toBe(true);
    expect(result.distance).toBe(20);
    expect(result.shouldTrigger).toBe(false);
  });

  it("does not trigger one pixel short of the threshold", () => {
    expect(computePullToRefresh(0, PULL_TO_REFRESH_THRESHOLD_PX - 1).shouldTrigger).toBe(false);
  });

  it("triggers exactly at the threshold", () => {
    expect(computePullToRefresh(0, PULL_TO_REFRESH_THRESHOLD_PX).shouldTrigger).toBe(true);
  });

  it("triggers past the threshold", () => {
    expect(computePullToRefresh(0, PULL_TO_REFRESH_THRESHOLD_PX + 50).shouldTrigger).toBe(true);
  });

  it("clamps the visible distance so pulling further doesn't grow the indicator forever", () => {
    const result = computePullToRefresh(0, 500);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.distance).toBeLessThan(500);
  });

  it("clamps progress at 1 once well past the threshold", () => {
    expect(computePullToRefresh(0, PULL_TO_REFRESH_THRESHOLD_PX * 3).progress).toBe(1);
  });

  it("computes progress proportionally to a custom threshold", () => {
    const result = computePullToRefresh(0, 25, 50);
    expect(result.progress).toBe(0.5);
    expect(result.shouldTrigger).toBe(false);
  });

  it("is idle when not at the top even if the movement is large and downward", () => {
    expect(computePullToRefresh(1, 200)).toEqual(IDLE);
  });
});
