import { describe, expect, it } from "vitest";
import { validateGrantAdmin } from "./grant-admin";

describe("granting the Admin role", () => {
  it("rejects an unknown User", () => {
    const users = [{ id: "user-1", name: "Admin", isAdmin: true }];

    expect(validateGrantAdmin(users, "user-unknown")).toEqual({ outcome: "notFound" });
  });

  it("allows making a non-Admin User an Admin", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Ana", isAdmin: false },
    ];

    expect(validateGrantAdmin(users, "user-2")).toEqual({
      outcome: "allowed",
      user: { id: "user-2", name: "Ana", isAdmin: false },
    });
  });

  it("allows granting Admin to a User who already is one", () => {
    const users = [{ id: "user-1", name: "Admin", isAdmin: true }];

    expect(validateGrantAdmin(users, "user-1")).toEqual({
      outcome: "allowed",
      user: { id: "user-1", name: "Admin", isAdmin: true },
    });
  });
});
