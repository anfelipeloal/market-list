import { describe, expect, it } from "vitest";
import { shouldRefuseAsOffline } from "./mutation-refusal";

describe("refusing a mutation for lack of connection (ticket #17)", () => {
  it("refuses when the browser already reports being offline", () => {
    expect(shouldRefuseAsOffline({ browserReportsOffline: true, requestFailed: false })).toBe(true);
  });

  it("refuses when the request failed to reach the server, even if the browser hadn't noticed yet", () => {
    expect(shouldRefuseAsOffline({ browserReportsOffline: false, requestFailed: true })).toBe(true);
  });

  it("refuses when both signals agree the connection is down", () => {
    expect(shouldRefuseAsOffline({ browserReportsOffline: true, requestFailed: true })).toBe(true);
  });

  it("allows the mutation when the browser is online and the request reached the server", () => {
    expect(shouldRefuseAsOffline({ browserReportsOffline: false, requestFailed: false })).toBe(false);
  });
});
