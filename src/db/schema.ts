import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Every table enables Row Level Security with no policies: the public key reaches nothing,
// and only the Next.js server (privileged connection) reads or writes data. See ADR-0001.

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
