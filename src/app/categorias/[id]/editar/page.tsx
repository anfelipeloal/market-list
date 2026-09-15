import type { Metadata } from "next";
import Link from "next/link";
import { findCategoryById } from "@/db/categories";
import { requireUser } from "@/lib/session";
import { EditCategoryForm } from "./edit-category-form";

export const metadata: Metadata = {
  title: "Editar categoría",
};

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  // requireUser() reads the session cookie, which makes this route dynamic (see src/app/page.tsx).
  await requireUser();
  const { id } = await params;
  const category = await findCategoryById(id);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Link href="/" className="text-sm text-muted-foreground underline">
        Volver a la Despensa
      </Link>

      {category ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Editar categoría</h1>
          <EditCategoryForm categoryId={category.id} currentName={category.name} />
        </>
      ) : (
        <p className="mt-6 text-muted-foreground">No encontramos esa categoría.</p>
      )}
    </main>
  );
}
