import type { Metadata } from "next";
import { listCategories } from "@/db/categories";
import { listProducts } from "@/db/products";
import { buildShoppingListView } from "@/domain/shopping/shopping-list";
import { requireUser } from "@/lib/session";
import { ShoppingListView } from "./shopping-list-view";

export const metadata: Metadata = {
  title: "Lista de compras",
};

export default async function ShoppingListPage() {
  // requireUser() reads the session cookie, which makes this route dynamic (see src/app/(app)/page.tsx).
  const user = await requireUser();
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const shoppingList = buildShoppingListView(categories, products);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Lista de compras</h1>
      {/* isAdmin is resolved here, server-side, and only ever used to decide what to render:
          resetShoppingList (ticket #12) enforces the real Admin check itself via requireAdmin(),
          so a stale or tampered client can never use this prop to bypass it. */}
      <ShoppingListView shoppingList={shoppingList} isAdmin={user.isAdmin} />
    </main>
  );
}
