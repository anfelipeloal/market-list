import { describe, expect, it } from "vitest";
import { validateUserRename } from "./rename-user";

const users = [
  { id: "user-1", name: "José", isAdmin: true },
  { id: "user-2", name: "Ana", isAdmin: false },
];

describe("renaming a User", () => {
  it("rejects an unknown User", () => {
    expect(validateUserRename("user-unknown", "Pedro", users)).toEqual({ outcome: "notFound" });
  });

  it("rejects an empty name", () => {
    expect(validateUserRename("user-2", "", users)).toEqual({ outcome: "emptyName" });
  });

  it("rejects a whitespace-only name", () => {
    expect(validateUserRename("user-2", "   ", users)).toEqual({ outcome: "emptyName" });
  });

  it("rejects a name that collides with another User under name matching", () => {
    expect(validateUserRename("user-2", "jose", users)).toEqual({
      outcome: "duplicateName",
      existingUser: { id: "user-1", name: "José", isAdmin: true },
    });
  });

  it("allows renaming a User to a variant of its own name (fixing capitalization)", () => {
    expect(validateUserRename("user-1", "jose", users)).toEqual({
      outcome: "valid",
      id: "user-1",
      name: "jose",
      normalizedName: "jose",
    });
  });

  it("accepts a name that does not collide with any other User", () => {
    expect(validateUserRename("user-2", "Ana María", users)).toEqual({
      outcome: "valid",
      id: "user-2",
      name: "Ana María",
      normalizedName: "ana maria",
    });
  });
});
