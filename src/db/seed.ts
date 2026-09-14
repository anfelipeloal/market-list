import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { normalizeName } from "../domain/catalog/names";
import { STARTING_CATEGORIES } from "../domain/catalog/starting-categories";
import { categories } from "./schema";

// Seeds the starting Categories only into a Household that has none yet, so re-running it
// never re-creates Categories an Admin deleted on purpose.
async function seed() {
  const url = process.env.DIRECT_DATABASE_URL;
  if (!url) throw new Error("DIRECT_DATABASE_URL is not set");

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  try {
    const existing = await db.select({ id: categories.id }).from(categories).limit(1);
    if (existing.length > 0) {
      console.log("Categories already exist; nothing to seed.");
      return;
    }

    await db
      .insert(categories)
      .values(STARTING_CATEGORIES.map((name) => ({ name, normalizedName: normalizeName(name) })));
    console.log(`Seeded ${STARTING_CATEGORIES.length} starting Categories.`);
  } finally {
    await sql.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
