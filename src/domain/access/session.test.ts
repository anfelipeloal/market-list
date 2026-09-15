import { describe, expect, it } from "vitest";
import { SESSION_DURATION_MS, isSessionValid, sessionExpiresAt } from "./session";

describe("Session validity", () => {
  const expiresAt = new Date("2026-01-08T00:00:00.000Z");

  it("is valid strictly before expiry", () => {
    const now = new Date(expiresAt.getTime() - 1);
    expect(isSessionValid({ expiresAt }, now)).toBe(true);
  });

  it("is invalid exactly at expiry", () => {
    expect(isSessionValid({ expiresAt }, expiresAt)).toBe(false);
  });

  it("is invalid after expiry", () => {
    const now = new Date(expiresAt.getTime() + 1);
    expect(isSessionValid({ expiresAt }, now)).toBe(false);
  });
});

describe("Session expiry", () => {
  it("expires 7 days (604,800,000 ms) after sign-in", () => {
    expect(SESSION_DURATION_MS).toBe(604_800_000);
  });

  it("computes the expiry as sign-in time plus 7 days", () => {
    const signInAt = new Date("2026-01-01T00:00:00.000Z");
    expect(sessionExpiresAt(signInAt)).toEqual(new Date("2026-01-08T00:00:00.000Z"));
  });
});
