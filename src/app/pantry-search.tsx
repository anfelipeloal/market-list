"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { CategoryForm } from "./category-form";
import { ProductForm } from "./product-form";
import type { PantryCategory } from "@/domain/catalog/pantry";
import { searchPantry } from "@/domain/catalog/search-pantry";

// Owns the search text and filters the Pantry view on every keystroke, entirely in the browser:
// the server already sent every Category and Product, so there is no round trip while typing.
// While a search is active, the add-Product and create-Category forms are hidden so the filtered
// results stay focused; clearing the search restores the full Despensa with all its forms.
export function PantrySearch({ pantry }: { pantry: PantryCategory[] }) {
  const [searchText, setSearchText] = useState("");
  const inputId = useId();
  const trimmedSearch = searchText.trim();
  const isSearching = trimmedSearch.length > 0;
  const filtered = useMemo(() => searchPantry(pantry, searchText), [pantry, searchText]);
  const matchCount = filtered.reduce((count, category) => count + category.products.length, 0);

  return (
    <>
      <div className="mt-4">
        <label htmlFor={inputId} className="sr-only">
          Buscar en la despensa
        </label>
        <input
          id={inputId}
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Buscar en la despensa"
          className="w-full rounded-lg border bg-background px-3 py-3 text-base"
        />
        {/* Announces result changes to screen readers, which don't notice the list re-rendering. */}
        <p aria-live="polite" className="sr-only">
          {isSearching ? (matchCount === 1 ? "1 producto encontrado" : `${matchCount} productos encontrados`) : ""}
        </p>
      </div>

      {pantry.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Todavía no hay categorías.</p>
      ) : isSearching && filtered.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No encontramos productos con «{trimmedSearch}».</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {filtered.map((category) => (
            <li key={category.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <h2 className="text-lg font-semibold">{category.name}</h2>
                <Link href={`/categorias/${category.id}/editar`} className="text-sm text-muted-foreground underline">
                  Editar
                </Link>
              </div>

              {category.products.length > 0 ? (
                <ul className="divide-y">
                  {category.products.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-2 px-4 py-3 text-base">
                      <span>{product.name}</span>
                      <Link href={`/productos/${product.id}/editar`} className="text-sm text-muted-foreground underline">
                        Editar
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {!isSearching ? (
                <div className={category.products.length > 0 ? "border-t" : undefined}>
                  <ProductForm categoryId={category.id} categoryName={category.name} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {!isSearching ? <CategoryForm /> : null}
    </>
  );
}
