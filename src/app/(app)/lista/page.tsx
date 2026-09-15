import type { Metadata } from "next";
import { listCategories } from "@/db/categories";
import { listProducts } from "@/db/products";
import { buildShoppingListView } from "@/domain/shopping/shopping-list";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Lista de compras",
};

export default async function ShoppingListPage() {
  // requireUser() reads the session cookie, which makes this route dynamic (see src/app/(app)/page.tsx).
  await requireUser();
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const shoppingList = buildShoppingListView(categories, products);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Lista de compras</h1>

      {shoppingList.length === 0 ? (
        <p className="mt-6 text-muted-foreground">La lista de compras está vacía.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {shoppingList.map((category) => (
            <li key={category.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-lg font-semibold">{category.name}</h2>
              </div>
              <ul className="divide-y">
                {category.products.map((product) => (
                  // Tapping a Shopping List Product does nothing yet: checking it In Cart is
                  // ticket #10.
                  <li key={product.id} className="px-4 py-3 text-base">
                    {product.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
