import type { Metadata } from "next";
import { listCategories } from "@/db/categories";
import { findProductById } from "@/db/products";
import { sortByName } from "@/domain/catalog/names";
import { requireUser } from "@/lib/session";
import { PRODUCT_NOT_FOUND_MESSAGE } from "@/app/(app)/catalog-messages";
import { EditPageHeader } from "@/app/(app)/edit-page-header";
import { DeleteProductButton } from "./delete-product-button";
import { EditProductForm } from "./edit-product-form";

export const metadata: Metadata = {
  title: "Editar producto",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // requireUser() reads the session cookie, which makes this route dynamic (see src/app/page.tsx).
  // isAdmin decides whether DeleteProductButton (ticket #15) shows itself at all — a courtesy
  // only, deleteProduct's own requireAdmin() call is the real enforcement.
  const user = await requireUser();
  const { id } = await params;
  const [product, categories] = await Promise.all([findProductById(id), listCategories()]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <EditPageHeader
        backHref="/"
        backLabel="Volver a la Despensa"
        trailing={
          product ? (
            <DeleteProductButton productId={product.id} productName={product.name} isAdmin={user.isAdmin} />
          ) : null
        }
      />

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
        <p className="mt-6 text-muted-foreground">{PRODUCT_NOT_FOUND_MESSAGE}</p>
      )}
    </main>
  );
}
