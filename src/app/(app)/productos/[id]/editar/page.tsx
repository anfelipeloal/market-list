import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "@/db/categories";
import { findProductById } from "@/db/products";
import { sortByName } from "@/domain/catalog/names";
import { requireUser } from "@/lib/session";
import { EditProductForm } from "./edit-product-form";

export const metadata: Metadata = {
  title: "Editar producto",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // requireUser() reads the session cookie, which makes this route dynamic (see src/app/page.tsx).
  await requireUser();
  const { id } = await params;
  const [product, categories] = await Promise.all([findProductById(id), listCategories()]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Link href="/" className="text-sm text-muted-foreground underline">
        Volver a la Despensa
      </Link>

      {product ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Editar producto</h1>
          <EditProductForm
            productId={product.id}
            currentName={product.name}
            categoryId={product.categoryId}
            categories={sortByName(categories)}
          />
        </>
      ) : (
        <p className="mt-6 text-muted-foreground">No encontramos ese producto.</p>
      )}
    </main>
  );
}
