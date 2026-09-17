import { describe, expect, it } from "vitest";
import { isLastAdmin } from "./last-admin";

describe("the last-Admin invariant", () => {
  it("is true for the Household's only Admin", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Ana", isAdmin: false },
    ];

    expect(isLastAdmin("user-1", users)).toBe(true);
  });

  it("is false for an Admin while another Admin remains", () => {
    const users = [
      { id: "user-1", name: "Admin", isAdmin: true },
      { id: "user-2", name: "Otro Admin", isAdmin: true },
    ];

    expect(isLastAdmin("user-1", users)).toBe(false);
  });

  it("is false for a non-Admin, even when they are the only User", () => {
    const users = [{ id: "user-1", name: "Ana", isAdmin: false }];

    expect(isLastAdmin("user-1", users)).toBe(false);
  });

  it("is false for an unknown User", () => {
    const users = [{ id: "user-1", name: "Admin", isAdmin: true }];

    expect(isLastAdmin("user-unknown", users)).toBe(false);
  });
});
