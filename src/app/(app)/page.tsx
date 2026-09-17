import { listCategories } from "@/db/categories";
import { listProducts } from "@/db/products";
import { buildPantryView } from "@/domain/catalog/pantry";
import { requireUser } from "@/lib/session";
import { PantrySearch } from "./pantry-search";

export default async function PantryPage() {
  // requireUser() reads the session cookie, which makes this route dynamic: the Pantry always
  // reflects the latest data instead of being prerendered at build.
  await requireUser();
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const pantry = buildPantryView(categories, products);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      {/* The heading renders inside PantrySearch itself (not here) so the pull-to-refresh gesture's
          container covers the whole screen, heading included -- see use-refresh-on-return.ts. */}
      <PantrySearch pantry={pantry} />
    </main>
  );
}
