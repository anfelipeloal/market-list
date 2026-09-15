import "server-only";

import { eq } from "drizzle-orm";
import { isValidId } from "@/domain/ids";
import { db } from "./client";
import { categories } from "./schema";

export type CategoryRow = { id: string; name: string };

export async function listCategories(): Promise<CategoryRow[]> {
  return db.select({ id: categories.id, name: categories.name }).from(categories);
}

export async function insertCategory(name: string, normalizedName: string): Promise<CategoryRow> {
  const [category] = await db
    .insert(categories)
    .values({ name, normalizedName })
    .returning({ id: categories.id, name: categories.name });
  return category;
}

// Re-reads a Category by its normalized name after a unique-constraint race (see
// src/db/pg-errors.ts), to build the duplicate message from the row that actually won.
export async function findCategoryByNormalizedName(normalizedName: string): Promise<CategoryRow | null> {
  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.normalizedName, normalizedName))
    .limit(1);
  return category ?? null;
}

// Preloads the Category being edited on the rename page; an unknown OR malformed id renders a
// not-found message rather than a 500 (see src/domain/ids.ts — Postgres rejects a malformed id
// with 22P02 before this even gets to check for "unknown", so the shape is validated first).
export async function findCategoryById(id: string): Promise<CategoryRow | null> {
  if (!isValidId(id)) return null;

  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return category ?? null;
}

export async function updateCategoryName(id: string, name: string, normalizedName: string): Promise<CategoryRow> {
  if (!isValidId(id)) {
    // The caller (editCategory) only reaches here with an id it just matched against the
    // Categories it read, so a malformed id is unreachable in practice; this guard keeps every
    // by-id write behind the same shape check as the reads instead of trusting the caller.
    throw new Error(`updateCategoryName called with a malformed id: ${JSON.stringify(id)}`);
  }

  const [category] = await db
    .update(categories)
    .set({ name, normalizedName })
    .where(eq(categories.id, id))
    .returning({ id: categories.id, name: categories.name });
  return category;
}
