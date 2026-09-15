import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Every table enables Row Level Security with no policies: the public key reaches nothing,
// and only the Next.js server (privileged connection) reads or writes data. See ADR-0001.

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// A Product's name is unique across every Category, not just its own (see CONTEXT.md), so the
// unique constraint lives on the table rather than being scoped to categoryId. Deleting a
// Category that still has Products is rejected at the database level (onDelete: "restrict");
// deleting Categories at all is ticket #15.
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// A User signs in by PIN alone, so the keyed PIN hash must be unique: it is the only
// identifier. The PIN itself is never stored (see ADR-0001 and src/lib/pin-hash.ts).
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
  pinHash: text("pin_hash").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// Sessions live server-side so that removing a User or changing their PIN can end their
// sessions immediately; only the SHA-256 hash of the opaque cookie token is stored, so a
// leaked database backup can't be replayed as a session. See ADR-0001.
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// Every sign-in attempt whose PIN was actually evaluated, win or lose: the lockout rules in
// src/domain/access/lockout.ts read recent rows here to decide whether to allow the next
// attempt. Attempts rejected because of an existing block or pause are never evaluated and so
// are never inserted (see src/app/ingresar/actions.ts), otherwise a blocked IP could never
// recover. Rows older than 24 hours are opportunistically deleted whenever a new one is
// recorded (src/db/sign-in-attempts.ts), since nothing older ever matters to either rule.
export const signInAttempts = pgTable("sign_in_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ip: text("ip").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  succeeded: boolean("succeeded").notNull(),
}).enableRLS();
