import { describe, expect, it } from "vitest";
import { validatePinChange } from "./change-pin";

describe("Change PIN", () => {
  const users = [
    { id: "user-1", name: "Admin", isAdmin: true },
    { id: "user-2", name: "Ana", isAdmin: false },
  ];

  it("rejects an unknown User", () => {
    expect(validatePinChange("user-unknown", "1357", users)).toEqual({ outcome: "notFound" });
  });

  it("rejects a PIN that isn't exactly 4 digits", () => {
    expect(validatePinChange("user-2", "135", users)).toEqual({ outcome: "invalidPin" });
  });

  it("allows a well-formed new PIN for an existing User", () => {
    expect(validatePinChange("user-2", "1357", users)).toEqual({
      outcome: "valid",
      userId: "user-2",
      pin: "1357",
    });
  });

  it("allows an Admin to change their own PIN", () => {
    expect(validatePinChange("user-1", "1357", users)).toEqual({
      outcome: "valid",
      userId: "user-1",
      pin: "1357",
    });
  });
});
