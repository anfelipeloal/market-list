import "server-only";

import { eq } from "drizzle-orm";
import { normalizeName } from "@/domain/catalog/names";
import { isValidPin } from "@/domain/access/pin";
import { hashPin } from "@/lib/pin-hash";
import { db } from "./client";
import { users } from "./schema";

export type SignedInUser = { id: string; name: string; isAdmin: boolean };

export async function findUserByPinHash(pinHash: string): Promise<SignedInUser | null> {
  const [user] = await db
    .select({ id: users.id, name: users.name, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.pinHash, pinHash))
    .limit(1);
  return user ?? null;
}

// Creates the first Admin from deployment configuration the moment anyone reaches the sign-in
// path while the Household has no Users yet. No manual seed step. Idempotent: if two requests
// both see an empty table, the second insert's unique constraints are violated and ignored via
// onConflictDoNothing, so only one Admin is ever created.
export async function ensureFirstAdminExists(): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  const name = process.env.FIRST_ADMIN_NAME;
  const pin = process.env.FIRST_ADMIN_PIN;
  if (!name || !pin) {
    throw new Error("FIRST_ADMIN_NAME and FIRST_ADMIN_PIN must both be set");
  }
  if (!isValidPin(pin)) {
    throw new Error("FIRST_ADMIN_PIN must be exactly 4 digits");
  }

  await db
    .insert(users)
    .values({
      name,
      normalizedName: normalizeName(name),
      pinHash: hashPin(pin),
      isAdmin: true,
    })
    .onConflictDoNothing();
}
