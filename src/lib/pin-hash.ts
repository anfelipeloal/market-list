import "server-only";

import { createHmac } from "node:crypto";

// PINs are never stored or logged in the clear. Storing HMAC-SHA256(PIN, secret) instead of a
// plain or salted hash means a stolen database can't be reversed by trying all 10,000 PINs
// without also having PIN_HASH_SECRET, which lives only in environment configuration. See
// ADR-0001.
export function hashPin(pin: string): string {
  const secret = process.env.PIN_HASH_SECRET;
  if (!secret) throw new Error("PIN_HASH_SECRET is not set");

  return createHmac("sha256", secret).update(pin).digest("hex");
}
