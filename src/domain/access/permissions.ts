export type AdminActionDecision = { outcome: "allowed" } | { outcome: "forbidden" };

// The permission rule behind every Admin-only action (ticket #12, Reset, is the first; #13, #14
// and #15 — User management and deleting Products/Categories — reuse this same decision, see
// CONTEXT.md's Admin definition). Takes only the acting User's Admin flag, not the User object
// itself, so it stays reusable for any check that only cares about that one fact and is trivially
// unit-tested without constructing a User.
//
// src/lib/session.ts#requireAdmin is the only production caller: it resolves the acting User
// server-side first, then applies this pure decision to their Admin flag, turning a "forbidden"
// outcome into a typed result instead of a thrown error. Hiding the button that triggers an
// Admin-only action is never the only protection — the server enforces this on every call.
export function decideAdminAction(isAdmin: boolean): AdminActionDecision {
  return isAdmin ? { outcome: "allowed" } : { outcome: "forbidden" };
}
