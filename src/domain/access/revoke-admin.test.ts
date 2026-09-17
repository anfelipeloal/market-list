import { describe, expect, it } from "vitest";
import { validateRevokeAdmin } from "./revoke-admin";

describe("revoking the Admin role", () => {
  it("rejects an unknown User", () => {
    const users = [{ id: "user-1", name: "Admin", isAdmin: true }];

    expect(validateRevokeAdmin(users, "user-unknown")).toEqual({ outcome: "notFound" });
  });

  it("allows revoking an Admin while another Admin remains", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Otro Admin", isAdmin: true },
    ];

    expect(validateRevokeAdmin(users, "user-1")).toEqual({
      outcome: "allowed",
      user: { id: "user-1", name: "Admin", isAdmin: true },
    });
  });

  it("refuses revoking the only Admin", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Ana", isAdmin: false },
    ];

    expect(validateRevokeAdmin(users, "user-1")).toEqual({ outcome: "lastAdmin" });
  });

  it("allows revoking a User who is already not an Admin", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Ana", isAdmin: false },
    ];

    expect(validateRevokeAdmin(users, "user-2")).toEqual({
      outcome: "allowed",
      user: { id: "user-2", name: "Ana", isAdmin: false },
    });
  });
});
