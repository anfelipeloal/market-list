import "server-only";

import { createHash, randomBytes } from "node:crypto";

// The opaque token goes in the cookie; only its SHA-256 hash is stored in the Sessions table,
// so a leaked database backup can't be used to forge a session.
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
