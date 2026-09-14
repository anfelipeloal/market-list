import "server-only";

import { db } from "./client";
import { categories } from "./schema";

export async function listCategories() {
  return db.select({ id: categories.id, name: categories.name }).from(categories);
}
