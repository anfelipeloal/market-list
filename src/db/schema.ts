import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Every table enables Row Level Security with no policies: the public key reaches nothing,
// and only the Next.js server (privileged connection) reads or writes data. See ADR-0001.

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
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
