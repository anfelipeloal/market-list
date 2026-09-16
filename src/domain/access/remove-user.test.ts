import { describe, expect, it } from "vitest";
import { validateUserRemoval } from "./remove-user";

describe("removing a User", () => {
  it("rejects an unknown User", () => {
    const users = [{ id: "user-1", name: "Admin", isAdmin: true }];

    expect(validateUserRemoval(users, "user-unknown")).toEqual({ outcome: "notFound" });
  });

  it("allows removing a non-Admin", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Ana", isAdmin: false },
    ];

    expect(validateUserRemoval(users, "user-2")).toEqual({
      outcome: "allowed",
      user: { id: "user-2", name: "Ana", isAdmin: false },
    });
  });

  it("allows removing an Admin while another Admin remains", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Otro Admin", isAdmin: true },
    ];

    expect(validateUserRemoval(users, "user-1")).toEqual({
      outcome: "allowed",
      user: { id: "user-1", name: "Admin", isAdmin: true },
    });
  });

  it("refuses removing the only Admin", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Ana", isAdmin: false },
    ];

    expect(validateUserRemoval(users, "user-1")).toEqual({ outcome: "lastAdmin" });
  });
});
