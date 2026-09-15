import { CategoryForm } from "./category-form";
import { listCategories } from "@/db/categories";
import { listProducts } from "@/db/products";
import { buildPantryView } from "@/domain/catalog/pantry";
import { requireUser } from "@/lib/session";
import { ProductForm } from "./product-form";

export default async function PantryPage() {
  // requireUser() reads the session cookie, which makes this route dynamic: the Pantry always
  // reflects the latest data instead of being prerendered at build.
  await requireUser();
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const pantry = buildPantryView(categories, products);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Despensa</h1>

      {pantry.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Todavía no hay categorías.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {pantry.map((category) => (
            <li key={category.id} className="overflow-hidden rounded-xl border bg-card">
              <h2 className="border-b px-4 py-3 text-lg font-semibold">{category.name}</h2>

              {category.products.length > 0 ? (
                <ul className="divide-y">
                  {category.products.map((product) => (
                    <li key={product.id} className="px-4 py-3 text-base">
                      {product.name}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className={category.products.length > 0 ? "border-t" : undefined}>
                <ProductForm categoryId={category.id} categoryName={category.name} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <CategoryForm />
    </main>
  );
}
