"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { finishTrip, toggleInCart, undoFinishTrip } from "../shopping-actions";
import { sortByName } from "@/domain/catalog/names";
import type { ShoppingListCategory } from "@/domain/shopping/shopping-list";
import { ShoppingListProductRow } from "./shopping-list-product-row";

const TOGGLE_STALE_MESSAGE = "Este producto cambió. Actualiza la página.";
const TOGGLE_NOT_FOUND_MESSAGE = "No encontramos ese producto.";
const FINISH_TRIP_EMPTY_MESSAGE = "No hay productos en el carrito.";
const FINISH_TRIP_STALE_MESSAGE = "La lista cambió. Actualiza la página.";
const FINISH_TRIP_TOAST_ID = "finish-trip";
const UNDO_TIMEOUT_MS = 5000;

function toggleMessageFor(outcome: "stale" | "notFound"): string {
  return outcome === "notFound" ? TOGGLE_NOT_FOUND_MESSAGE : TOGGLE_STALE_MESSAGE;
}

function finishTripMessage(count: number): string {
  return count === 1
    ? "Compra terminada: 1 producto volvió a la despensa."
    : `Compra terminada: ${count} productos volvieron a la despensa.`;
}

// Owns the Lista de compras' two interactive behaviours (ticket #10): tapping a row toggles a
// Product In Cart, and "Terminar compra" runs Finish Trip. Server truth is the source of record —
// a page refresh always reflects it exactly, driven by src/app/(app)/lista/page.tsx re-rendering
// with fresh data after revalidatePath — but both actions also update local state on success so
// the screen reflects the change instantly instead of waiting for a navigation.
//
// Local state is layered on top of the server-sent view rather than replacing it:
// - inCartOverrides flips a single Product's In Cart state after a confirmed toggle.
// - hiddenProductIds removes Products that Finish Trip just returned to the Pantry; undoing
//   Finish Trip un-hides them and marks them In Cart again via inCartOverrides.
// Re-deriving the displayed order (still-needed A-Z, then In Cart A-Z, ticket #10) from these
// layers on every render keeps the split correct after a toggle without duplicating the ordering
// rule: it reuses the same Spanish-locale sortByName the server-side domain core uses.
export function ShoppingListView({ shoppingList }: { shoppingList: ShoppingListCategory[] }) {
  const [inCartOverrides, setInCartOverrides] = useState<ReadonlyMap<string, boolean>>(new Map());
  const [hiddenProductIds, setHiddenProductIds] = useState<ReadonlySet<string>>(new Set());
  const [isFinishingTrip, startFinishTripTransition] = useTransition();
  // Guards "Deshacer" on the Finish Trip toast exactly like the per-Product undo in
  // pantry-search.tsx: a ref, not state, so a double tap is caught synchronously instead of
  // racing a re-render. There is at most one Finish Trip toast at a time, so a single boolean is
  // enough (unlike pantry-search's per-Product Set).
  const undoInFlight = useRef(false);

  const visibleShoppingList = useMemo(() => {
    return shoppingList
      .map((category) => {
        const products = category.products
          .filter((product) => !hiddenProductIds.has(product.id))
          .map((product) => ({ ...product, inCart: inCartOverrides.get(product.id) ?? product.inCart }));
        const needed = sortByName(products.filter((product) => !product.inCart));
        const inCart = sortByName(products.filter((product) => product.inCart));

        return { ...category, products: [...needed, ...inCart] };
      })
      .filter((category) => category.products.length > 0);
  }, [shoppingList, hiddenProductIds, inCartOverrides]);

  const hasInCart = visibleShoppingList.some((category) => category.products.some((product) => product.inCart));

  const handleToggle = useCallback(async (productId: string, currentlyInCart: boolean) => {
    const result = await toggleInCart(productId);
    if (result.outcome !== "ok") {
      toast(toggleMessageFor(result.outcome));
      return;
    }
    setInCartOverrides((prev) => new Map(prev).set(productId, !currentlyInCart));
  }, []);

  const handleUndoFinishTrip = useCallback(async (affectedIds: string[]) => {
    if (undoInFlight.current) return;
    undoInFlight.current = true;
    // Dismissing immediately removes the Deshacer button itself, so a human can't tap it again
    // either; the ref guard above covers any tap that still lands before this takes effect.
    toast.dismiss(FINISH_TRIP_TOAST_ID);

    const result = await undoFinishTrip(affectedIds);
    undoInFlight.current = false;
    if (result.outcome !== "ok") {
      toast(FINISH_TRIP_STALE_MESSAGE);
      return;
    }

    setHiddenProductIds((prev) => {
      const next = new Set(prev);
      for (const id of affectedIds) next.delete(id);
      return next;
    });
    setInCartOverrides((prev) => {
      const next = new Map(prev);
      for (const id of affectedIds) next.set(id, true);
      return next;
    });
  }, []);

  const handleFinishTrip = useCallback(() => {
    startFinishTripTransition(async () => {
      const result = await finishTrip();
      if (result.outcome === "empty") {
        toast(FINISH_TRIP_EMPTY_MESSAGE);
        return;
      }

      const { affectedIds } = result;
      setHiddenProductIds((prev) => new Set([...prev, ...affectedIds]));
      toast(finishTripMessage(affectedIds.length), {
        id: FINISH_TRIP_TOAST_ID,
        duration: UNDO_TIMEOUT_MS,
        action: {
          label: "Deshacer",
          onClick: () => {
            void handleUndoFinishTrip(affectedIds);
          },
        },
      });
    });
  }, [handleUndoFinishTrip]);

  return (
    <>
      {visibleShoppingList.length === 0 ? (
        <p className="mt-6 text-muted-foreground">La lista de compras está vacía.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {visibleShoppingList.map((category) => (
            <li key={category.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-lg font-semibold">{category.name}</h2>
              </div>
              <ul className="divide-y">
                {category.products.map((product) => (
                  <ShoppingListProductRow key={product.id} product={product} onToggle={handleToggle} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {/* Sticky within the page's own scroll flow, right above the space AppLayout reserves for
          the fixed BottomNav (pb-24), so it never scrolls behind it and never needs its own
          height measured against BottomNav's. */}
      <div className="sticky bottom-24 z-10 -mx-4 mt-6 border-t bg-background px-4 py-3">
        <button
          type="button"
          disabled={!hasInCart || isFinishingTrip}
          onClick={handleFinishTrip}
          className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground disabled:opacity-50"
        >
          Terminar compra
        </button>
      </div>
    </>
  );
}
