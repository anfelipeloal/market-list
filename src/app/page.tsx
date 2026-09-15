import { connection } from "next/server";
import { listCategories } from "@/db/categories";
import { sortByName } from "@/domain/catalog/names";

export default async function PantryPage() {
  // The Pantry changes at runtime, so it must be read per request, never prerendered at build.
  await connection();
  const categories = sortByName(await listCategories());

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Despensa</h1>

      {categories.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Todavía no hay categorías.</p>
      ) : (
        <ul className="mt-4 divide-y rounded-xl border bg-card">
          {categories.map((category) => (
            <li key={category.id} className="px-4 py-3 text-base">
              {category.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
