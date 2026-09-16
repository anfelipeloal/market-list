import { describe, expect, it } from "vitest";
import { decideAdminAction } from "./permissions";

// decideAdminAction is the permission rule behind every Admin-only action (ticket #12, Reset, is
// the first; see CONTEXT.md's Admin definition). It is unit-tested here on its own, independent of
// requireAdmin() (src/lib/session.ts), which resolves the real acting User and is not part of the
// domain core.
describe("an Admin-only action", () => {
  it("is allowed for an Admin", () => {
    expect(decideAdminAction(true)).toEqual({ outcome: "allowed" });
  });

  it("is forbidden for a User who is not an Admin", () => {
    expect(decideAdminAction(false)).toEqual({ outcome: "forbidden" });
  });
});
