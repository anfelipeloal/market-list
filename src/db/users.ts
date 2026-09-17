import "server-only";

import { eq, sql } from "drizzle-orm";
import { normalizeName } from "@/domain/catalog/names";
import { isValidId } from "@/domain/ids";
import { isValidPin } from "@/domain/access/pin";
import { hashPin } from "@/lib/pin-hash";
import { isUniqueViolation } from "./pg-errors";
import { db, type Tx } from "./client";
import { users } from "./schema";

// Either the plain db client or a transaction handle: every function below that a caller might
// need to run inside withAdminGuardLock's transaction (see below) accepts this instead of
// hardcoding `db`, so the same statements work whether or not they're serialized by that lock —
// exactly like src/db/sign-in-attempts.ts's functions accept a Tx for the same reason.
type DbOrTx = Tx | typeof db;

export type SignedInUser = { id: string; name: string; isAdmin: boolean };

// Every User-returning query below selects exactly these three columns, never pinHash: the
// Usuarios screen (ticket #13) lists Users by name and must never send a PIN or its hash to the
// client (see CONTEXT.md — Admins are "never shown an existing PIN").
const USER_COLUMNS = { id: users.id, name: users.name, isAdmin: users.isAdmin };

// Takes the sign-in action's transaction handle (see src/db/sign-in-attempts.ts,
// withSignInLock) rather than the plain db client, so PIN evaluation happens inside the same
// lock-serialized transaction as the lockout check and the attempt recording.
export async function findUserByPinHash(tx: Tx, pinHash: string): Promise<SignedInUser | null> {
  const [user] = await tx.select(USER_COLUMNS).from(users).where(eq(users.pinHash, pinHash)).limit(1);
  return user ?? null;
}

// Creates the first Admin from deployment configuration the moment anyone reaches the sign-in
// path while the Household has no Users yet. No manual seed step. Idempotent: if two requests
// both see an empty table, the second insert's unique constraints are violated and ignored via
// onConflictDoNothing, so only one Admin is ever created. Runs inside the sign-in action's
// transaction for the same reason as findUserByPinHash above.
export async function ensureFirstAdminExists(tx: Tx): Promise<void> {
  const existing = await tx.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  const name = process.env.FIRST_ADMIN_NAME;
  const pin = process.env.FIRST_ADMIN_PIN;
  if (!name || !pin) {
    throw new Error("FIRST_ADMIN_NAME and FIRST_ADMIN_PIN must both be set");
  }
  if (!isValidPin(pin)) {
    throw new Error("FIRST_ADMIN_PIN must be exactly 4 digits");
  }

  await tx
    .insert(users)
    .values({
      name,
      normalizedName: normalizeName(name),
      pinHash: hashPin(pin),
      isAdmin: true,
    })
    .onConflictDoNothing();
}

// Arbitrary fixed key namespacing the Admin-count guard's serialization lock (see
// withAdminGuardLock below). Distinct from SIGN_IN_LOCK_KEY (src/db/sign-in-attempts.ts) — every
// advisory lock needs its own constant, and this one guards a different invariant.
const ADMIN_GUARD_LOCK_KEY = 20_260_013;

// Runs `run` inside one transaction serialized by a transaction-scoped Postgres advisory lock, so
// two changes to who is an Admin can never both pass the last-Admin check at once. Without this,
// removeUser's read-decide-delete (src/app/(app)/usuarios/actions.ts) is three unserialized round
// trips: two Admins removing each other at nearly the same moment could each read the same
// "two Admins" snapshot, each decide their own removal is safe, and both deletes commit — leaving
// the Household with zero Admins, breaking CONTEXT.md's invariant that it always has at least one.
// Modeled on withSignInLock (src/db/sign-in-attempts.ts), which serializes the sign-in lockout's
// own read-decide-record sequence the same way.
//
// Every caller must re-read the Users INSIDE this transaction (not before it) via the `tx` this
// hands to `run`, and write inside it too. Ticket #14 (granting/revoking the Admin role) must
// reuse this same lock: a demotion racing a removal is exactly the same failure.
export async function withAdminGuardLock<T>(run: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_GUARD_LOCK_KEY})`);
    return run(tx);
  });
}

// Powers the Usuarios screen (ticket #13, Admin-only — enforced by requireAdmin before this is
// ever called) and every create/rename/removal action below, which need every User's name and
// Admin flag to run the domain core's decisions (checkNameCollision, validateUserRemoval's
// last-Admin guard). Never selects pinHash: see USER_COLUMNS above. Accepts a transaction handle
// (see DbOrTx) so removeUser can re-read the Users inside withAdminGuardLock's transaction rather
// than before it.
export async function listUsers(client: DbOrTx = db): Promise<SignedInUser[]> {
  return client.select(USER_COLUMNS).from(users);
}

// Re-reads a User by normalized name after a unique-constraint race (see src/db/pg-errors.ts and
// insertUserOrDuplicate below), to build the duplicate-name message from the row that actually
// won, and as the race guard for a rename (see updateUserName's caller,
// src/app/(app)/usuarios/actions.ts#renameUser, which reuses writeUniqueOrDuplicate exactly like
// editCategory does).
export async function findUserByNormalizedName(normalizedName: string): Promise<SignedInUser | null> {
  const [user] = await db.select(USER_COLUMNS).from(users).where(eq(users.normalizedName, normalizedName)).limit(1);
  return user ?? null;
}

// Preloads the User being renamed on the edit page; an unknown OR malformed id renders a
// not-found message rather than a 500 (see src/domain/ids.ts and src/db/categories.ts's
// findCategoryById for the same pattern).
export async function findUserById(id: string): Promise<SignedInUser | null> {
  if (!isValidId(id)) return null;

  const [user] = await db.select(USER_COLUMNS).from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export type InsertUserResult =
  | { outcome: "written"; user: SignedInUser }
  | { outcome: "duplicateName"; existing: SignedInUser }
  | { outcome: "duplicatePin" };

// Creates a new User (ticket #13, Admin-only), hashing the PIN with the same keyed hash sign-in
// verifies against (see src/lib/pin-hash.ts) — the plain PIN is never stored. A new User is never
// an Admin (see CONTEXT.md and src/db/schema.ts's isAdmin default).
//
// Two different unique constraints back this insert: users.normalizedName (checked by the domain
// core first, see validateNewUser in src/domain/access/create-user.ts) and users.pinHash (which
// the domain core can NEVER check itself, since hashing a PIN needs PIN_HASH_SECRET, a server-only
// value — see hashPin). This can't reuse the generic writeUniqueOrDuplicate helper
// (src/db/pg-errors.ts), which only knows how to report one kind of duplicate: on a unique
// violation here, a re-read by normalized name tells the two race outcomes apart — found means the
// name lost the race, not found means the only other unique column (pinHash) must have.
export async function insertUserOrDuplicate(name: string, normalizedName: string, pin: string): Promise<InsertUserResult> {
  try {
    const [user] = await db
      .insert(users)
      .values({ name, normalizedName, pinHash: hashPin(pin), isAdmin: false })
      .returning(USER_COLUMNS);
    return { outcome: "written", user };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await findUserByNormalizedName(normalizedName);
    return existing ? { outcome: "duplicateName", existing } : { outcome: "duplicatePin" };
  }
}

// Renames a User (ticket #13, Admin-only). Changing a User's PIN or Admin role is out of scope for
// this ticket (#14); only the name column is ever written here.
export async function updateUserName(id: string, name: string, normalizedName: string): Promise<SignedInUser> {
  if (!isValidId(id)) {
    // The caller (renameUser) only reaches here with an id it just matched against the Users it
    // read, so a malformed id is unreachable in practice; this guard keeps every by-id write
    // behind the same shape check as the reads instead of trusting the caller (see
    // src/db/categories.ts#updateCategoryName for the same pattern).
    throw new Error(`updateUserName called with a malformed id: ${JSON.stringify(id)}`);
  }

  const [user] = await db.update(users).set({ name, normalizedName }).where(eq(users.id, id)).returning(USER_COLUMNS);
  return user;
}

// Removes a User (ticket #13, Admin-only — the last-Admin guard is the domain core's
// validateUserRemoval, applied by the caller before this ever runs, inside withAdminGuardLock's
// transaction). Deletes that User's Sessions as a side effect of the foreign key's ON DELETE
// CASCADE (see src/db/schema.ts, sessions.userId), ending their access immediately instead of
// waiting for their session to expire on its own. Accepts a transaction handle (see DbOrTx) so the
// delete commits (or rolls back) as part of the same locked transaction as the read that decided
// it was safe.
export async function deleteUser(id: string, client: DbOrTx = db): Promise<SignedInUser | null> {
  if (!isValidId(id)) return null;

  const [user] = await client.delete(users).where(eq(users.id, id)).returning(USER_COLUMNS);
  return user ?? null;
}
