import { describe, expect, it } from "vitest";
import { validateNewUser } from "./create-user";

describe("creating a User", () => {
  it("rejects an empty name", () => {
    expect(validateNewUser("", "2468", [])).toEqual({ outcome: "emptyName" });
  });

  it("rejects a whitespace-only name", () => {
    expect(validateNewUser("   ", "2468", [])).toEqual({ outcome: "emptyName" });
  });

  it("rejects a name that collides with an existing User under name matching", () => {
    const existing = [{ id: "user-1", name: "José", isAdmin: false }];

    expect(validateNewUser("jose", "2468", existing)).toEqual({
      outcome: "duplicateName",
      existingUser: { id: "user-1", name: "José", isAdmin: false },
    });
  });

  it("rejects a PIN with fewer than 4 digits", () => {
    expect(validateNewUser("Ana", "246", [])).toEqual({ outcome: "invalidPin" });
  });

  it("rejects a PIN with more than 4 digits", () => {
    expect(validateNewUser("Ana", "24680", [])).toEqual({ outcome: "invalidPin" });
  });

  it("rejects a PIN that isn't all digits", () => {
    expect(validateNewUser("Ana", "24ab", [])).toEqual({ outcome: "invalidPin" });
  });

  it("checks the name before the PIN when both are invalid", () => {
    expect(validateNewUser("", "abc", [])).toEqual({ outcome: "emptyName" });
  });

  it("accepts a unique name with a valid 4-digit PIN", () => {
    expect(validateNewUser("Ana", "2468", [])).toEqual({
      outcome: "valid",
      name: "Ana",
      normalizedName: "ana",
      pin: "2468",
    });
  });

  it("stores the cleaned display name: trimmed and with internal whitespace collapsed", () => {
    expect(validateNewUser("  Ana   María ", "2468", [])).toEqual({
      outcome: "valid",
      name: "Ana María",
      normalizedName: "ana maria",
      pin: "2468",
    });
  });
});
