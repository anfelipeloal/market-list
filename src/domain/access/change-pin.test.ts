import { describe, expect, it } from "vitest";
import { validatePinChange } from "./change-pin";

describe("Change PIN", () => {
  const users = [
    { id: "user-1", name: "Admin", isAdmin: true },
    { id: "user-2", name: "Ana", isAdmin: false },
  ];

  it("rejects an unknown User", () => {
    expect(validatePinChange(users, "user-unknown", "1357")).toEqual({ outcome: "notFound" });
  });

  it("rejects a PIN that isn't exactly 4 digits", () => {
    expect(validatePinChange(users, "user-2", "135")).toEqual({ outcome: "invalidPin" });
  });

  it("allows a well-formed new PIN for an existing User", () => {
    expect(validatePinChange(users, "user-2", "1357")).toEqual({
      outcome: "valid",
      userId: "user-2",
      pin: "1357",
    });
  });

  it("allows an Admin to change their own PIN", () => {
    expect(validatePinChange(users, "user-1", "1357")).toEqual({
      outcome: "valid",
      userId: "user-1",
      pin: "1357",
    });
  });
});
