import { listCategories } from "@/db/categories";
import { sortByName } from "@/domain/catalog/names";
import { requireUser } from "@/lib/session";

export default async function PantryPage() {
  // requireUser() reads the session cookie, which makes this route dynamic: the Pantry always
  // reflects the latest data instead of being prerendered at build.
  await requireUser();
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
