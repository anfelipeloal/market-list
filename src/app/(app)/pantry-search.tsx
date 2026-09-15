"use client";

import Link from "next/link";
import { useCallback, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryForm } from "./category-form";
import { PantryProductRow } from "./pantry-product-row";
import { ProductForm } from "./product-form";
import { moveToShoppingList, returnToPantry } from "./shopping-actions";
import type { PantryCategory } from "@/domain/catalog/pantry";
import { searchPantry } from "@/domain/catalog/search-pantry";

const STALE_MESSAGE = "Este producto cambió. Actualiza la página.";
const UNDO_TIMEOUT_MS = 5000;

// Owns the search text and filters the Pantry view on every keystroke, entirely in the browser:
// the server already sent every Category and Product, so there is no round trip while typing.
// While a search is active, the add-Product and create-Category forms are hidden so the filtered
// results stay focused; clearing the search restores the full Despensa with all its forms.
//
// Also owns moving a Product to the Shopping List (ticket #9): a tap on its own row, or the
// duplicate-create offer in ProductForm, both go through moveProductAway below, which hides the
// Product from every Category it could appear in (there's exactly one) and shows the undo
// notification. Server truth is the source of record — a page refresh always reflects it exactly
// — but hiding happens locally first so the Despensa updates the instant the server confirms the
// move, without waiting for a full navigation.
export function PantrySearch({ pantry }: { pantry: PantryCategory[] }) {
  const [searchText, setSearchText] = useState("");
  const [hiddenProductIds, setHiddenProductIds] = useState<ReadonlySet<string>>(new Set());
  const inputId = useId();

  const visiblePantry = useMemo(
    () =>
      pantry.map((category) => ({
        ...category,
        products: category.products.filter((product) => !hiddenProductIds.has(product.id)),
      })),
    [pantry, hiddenProductIds],
  );

  const handleUndo = useCallback(async (productId: string) => {
    const result = await returnToPantry(productId);
    if (result.outcome !== "ok") {
      toast(STALE_MESSAGE);
      return;
    }
    setHiddenProductIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  // Moves a Product to the Shopping List and, on success, hides it here and shows the undo
  // notification; returns whether the move actually happened so callers (the tap handler below,
  // and ProductForm's duplicate-create offer) can react (or not) accordingly.
  const moveProductAway = useCallback(
    async (productId: string, productName: string): Promise<boolean> => {
      const result = await moveToShoppingList(productId);
      if (result.outcome !== "ok") {
        toast(STALE_MESSAGE);
        return false;
      }

      setHiddenProductIds((prev) => new Set(prev).add(productId));
      toast(`${productName} se agregó a la lista de compras.`, {
        duration: UNDO_TIMEOUT_MS,
        action: {
          label: "Deshacer",
          onClick: () => {
            void handleUndo(productId);
          },
        },
      });
      return true;
    },
    [handleUndo],
  );

  const trimmedSearch = searchText.trim();
  const isSearching = trimmedSearch.length > 0;
  const filtered = useMemo(() => searchPantry(visiblePantry, searchText), [visiblePantry, searchText]);
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

      {visiblePantry.length === 0 ? (
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
                    <PantryProductRow key={product.id} product={product} onTap={moveProductAway} />
                  ))}
                </ul>
              ) : null}

              {!isSearching ? (
                <div className={category.products.length > 0 ? "border-t" : undefined}>
                  <ProductForm categoryId={category.id} categoryName={category.name} onMoveToShoppingList={moveProductAway} />
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
