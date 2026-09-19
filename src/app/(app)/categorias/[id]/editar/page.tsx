import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";
import { findCategoryById } from "@/db/categories";
import { requireUser } from "@/lib/session";
import { CATEGORY_NOT_FOUND_MESSAGE } from "@/app/(app)/catalog-messages";
import { IconLink } from "@/app/(app)/icon-control";
import { DeleteCategoryButton } from "./delete-category-button";
import { EditCategoryForm } from "./edit-category-form";

export const metadata: Metadata = {
  title: "Editar categoría",
};

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  // requireUser() reads the session cookie, which makes this route dynamic (see src/app/page.tsx).
  // isAdmin decides whether DeleteCategoryButton (ticket #15) shows itself at all — a courtesy
  // only, deleteCategory's own requireAdmin() call is the real enforcement.
  const user = await requireUser();
  const { id } = await params;
  const category = await findCategoryById(id);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <IconLink href="/" icon={ArrowLeftIcon} label="Volver a la Despensa" className="-ml-3" />

      {category ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Editar categoría</h1>
          <EditCategoryForm categoryId={category.id} currentName={category.name} />
          <DeleteCategoryButton categoryId={category.id} categoryName={category.name} isAdmin={user.isAdmin} />
        </>
      ) : (
        <p className="mt-6 text-muted-foreground">{CATEGORY_NOT_FOUND_MESSAGE}</p>
      )}
    </main>
  );
}
