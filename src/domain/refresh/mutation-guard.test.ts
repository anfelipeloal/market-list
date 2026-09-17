import { describe, expect, it } from "vitest";
import { canReconcileAfterRefresh } from "./mutation-guard";

describe("reconciling local state after a hook-triggered refresh lands", () => {
  it("allows reconciling when no mutation happened while the refresh was in flight", () => {
    expect(canReconcileAfterRefresh(0, 0)).toBe(true);
    expect(canReconcileAfterRefresh(3, 3)).toBe(true);
  });

  it("refuses reconciling when a mutation landed while the refresh was in flight", () => {
    expect(canReconcileAfterRefresh(0, 1)).toBe(false);
    expect(canReconcileAfterRefresh(2, 5)).toBe(false);
  });

  it("refuses reconciling even when the count appears to move backward (defensive: any change at all is untrusted)", () => {
    expect(canReconcileAfterRefresh(5, 4)).toBe(false);
  });
});
