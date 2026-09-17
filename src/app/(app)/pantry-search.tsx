"use client";

import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CategoryForm } from "./category-form";
import { PantryProductRow } from "./pantry-product-row";
import { ProductForm } from "./product-form";
import { RefreshIndicator } from "./refresh-indicator";
import { moveToShoppingList, returnToPantry } from "./shopping-actions";
import { shoppingResultMessage } from "./shopping-messages";
import { useRefreshOnReturn } from "./use-refresh-on-return";
import type { PantryCategory } from "@/domain/catalog/pantry";
import { searchPantry } from "@/domain/catalog/search-pantry";

const UNDO_TIMEOUT_MS = 5000;

// The toast's own id is derived from the Product's, so a second move/undo toast for the same
// Product replaces the first instead of stacking, and so it can be dismissed by id (see
// handleUndo below).
function moveToastId(productId: string): string {
  return `move-${productId}`;
}

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
//
// Refresh on return and pull-to-refresh (ticket #16): useRefreshOnReturn wires router.refresh() to
// focus/visibility and a pull gesture across this screen's whole content -- containerRef wraps the
// "Despensa" heading too (rendered here, not in page.tsx, for exactly that reason), so a pull
// starting on the heading works the same as one starting lower down; only BottomNav, entirely
// outside this component, is never part of the gesture. Its onRefreshed callback clears
// hiddenProductIds once the fresh `pantry` prop has actually landed: without that, an id hidden
// earlier this session (e.g. moved away, then moved back to the Pantry by anyone, on any device,
// before this refresh) would keep hiding a Product the server now says belongs here again — a
// stale local override resurrecting nothing, but wrongly suppressing a fresh row. Clearing it here
// is safe exactly because it happens after the new data is in, and only when no mutation of our
// own set an override while that refresh was still in flight (see notifyMutation below and
// src/domain/refresh/mutation-guard.ts).
export function PantrySearch({ pantry }: { pantry: PantryCategory[] }) {
  const [searchText, setSearchText] = useState("");
  const [hiddenProductIds, setHiddenProductIds] = useState<ReadonlySet<string>>(new Set());
  const inputId = useId();
  const handleRefreshed = useCallback(() => {
    setHiddenProductIds(new Set());
  }, []);
  const { containerRef, isRefreshing, pull, notifyMutation } = useRefreshOnReturn(handleRefreshed);
  // Tracks which Products already have an undo in flight, checked and set synchronously (a ref,
  // not state) so a second "Deshacer" tap — dispatched as its own, separate click event even when
  // it lands a moment after the first — sees the guard immediately rather than racing a
  // re-render. Without this, double-tapping Deshacer sends returnToPantry twice: the first
  // succeeds, and the second (now genuinely stale, since the Product is already back in the
  // Pantry) surfaces the stale message right after a successful undo.
  const undoInFlight = useRef<Set<string>>(new Set());

  const visiblePantry = useMemo(
    () =>
      pantry.map((category) => ({
        ...category,
        products: category.products.filter((product) => !hiddenProductIds.has(product.id)),
      })),
    [pantry, hiddenProductIds],
  );

  const handleUndo = useCallback(async (productId: string) => {
    if (undoInFlight.current.has(productId)) return;
    undoInFlight.current.add(productId);
    // Dismissing immediately removes the Deshacer button itself, so a human can't tap it again
    // either; the ref guard above covers any tap that still lands before this takes effect.
    toast.dismiss(moveToastId(productId));

    const result = await returnToPantry(productId);
    undoInFlight.current.delete(productId);
    if (result.outcome !== "ok") {
      toast(shoppingResultMessage(result.outcome));
      return;
    }
    // Reported before setting the override itself (see useRefreshOnReturn's module doc): a
    // hook-triggered refresh already in flight when this lands must not clear this override
    // against its own, now-stale snapshot.
    notifyMutation();
    setHiddenProductIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, [notifyMutation]);

  // Moves a Product to the Shopping List and, on success, hides it here and shows the undo
  // notification; returns whether the move actually happened so callers (the tap handler below,
  // and ProductForm's duplicate-create offer) can react (or not) accordingly.
  const moveProductAway = useCallback(
    async (productId: string, productName: string): Promise<boolean> => {
      const result = await moveToShoppingList(productId);
      if (result.outcome !== "ok") {
        toast(shoppingResultMessage(result.outcome));
        return false;
      }

      notifyMutation();
      setHiddenProductIds((prev) => new Set(prev).add(productId));
      toast(`${productName} se agregó a la lista de compras.`, {
        id: moveToastId(productId),
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
    [handleUndo, notifyMutation],
  );

  const trimmedSearch = searchText.trim();
  const isSearching = trimmedSearch.length > 0;
  const filtered = useMemo(() => searchPantry(visiblePantry, searchText), [visiblePantry, searchText]);
  const matchCount = filtered.reduce((count, category) => count + category.products.length, 0);

  return (
    <div ref={containerRef}>
      <RefreshIndicator isRefreshing={isRefreshing} pull={pull} />
      <h1 className="text-2xl font-semibold tracking-tight">Despensa</h1>
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
    </div>
  );
}
