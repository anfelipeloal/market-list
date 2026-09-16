"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { finishTrip, toggleInCart, undoFinishTrip } from "../shopping-actions";
import { shoppingResultMessage } from "../shopping-messages";
import { buildShoppingListView, type ShoppingListCategory } from "@/domain/shopping/shopping-list";
import { buildShoppingListMarkdown } from "@/domain/shopping/shopping-list-markdown";
import { ShoppingListProductRow } from "./shopping-list-product-row";

const FINISH_TRIP_EMPTY_MESSAGE = "No hay productos en el carrito.";
const FINISH_TRIP_STALE_MESSAGE = "La lista cambió. Actualiza la página.";
const FINISH_TRIP_TOAST_ID = "finish-trip";
const UNDO_TIMEOUT_MS = 5000;

const COPY_SUCCESS_MESSAGE = "Lista copiada.";
const COPY_FAILURE_MESSAGE = "No pudimos copiar la lista.";
const COPY_EMPTY_MESSAGE = "No hay nada para copiar.";

// Puts text on the clipboard, reporting success rather than assuming it (ticket #11): the
// Clipboard API can be missing (insecure context, older browser) or reject (no permission,
// browser quirk), and the caller must not tell the User it worked when it didn't.
async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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
// layers on every render re-runs the flattened Categories and Products back through
// buildShoppingListView, the same domain function src/app/(app)/lista/page.tsx calls for the
// initial server render — so the ordering rule has exactly one home instead of being
// reimplemented here.
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
    const categories = shoppingList.map((category) => ({ id: category.id, name: category.name }));
    const products = shoppingList.flatMap((category) =>
      category.products
        .filter((product) => !hiddenProductIds.has(product.id))
        .map((product) => ({
          id: product.id,
          name: product.name,
          categoryId: category.id,
          status: (inCartOverrides.get(product.id) ?? product.inCart)
            ? ("in_cart" as const)
            : ("shopping_list" as const),
        })),
    );

    return buildShoppingListView(categories, products);
  }, [shoppingList, hiddenProductIds, inCartOverrides]);

  const hasInCart = visibleShoppingList.some((category) => category.products.some((product) => product.inCart));

  // Recomputed from the same displayed view as visibleShoppingList (see the comment above), so
  // what gets copied always matches what is on screen at the moment of the tap, local overrides
  // included.
  const shoppingListMarkdown = useMemo(
    () => buildShoppingListMarkdown(visibleShoppingList),
    [visibleShoppingList],
  );
  const hasNothingToCopy = shoppingListMarkdown === "";

  const handleToggle = useCallback(async (productId: string, currentlyInCart: boolean) => {
    const result = await toggleInCart(productId);
    if (result.outcome !== "ok") {
      toast(shoppingResultMessage(result.outcome));
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

  // Copiar lista (ticket #11): puts the still-needed Products as a markdown checklist on the
  // clipboard, grouped by Category, so they can be pasted into a chat. Read-only — it never calls
  // a server action, so it can never change a Product's status. The empty-list guard mirrors the
  // button's own `disabled`, in case assistive technology still triggers a tap on it (see the
  // button's aria-label below).
  const handleCopyList = useCallback(async () => {
    if (shoppingListMarkdown === "") {
      toast(COPY_EMPTY_MESSAGE);
      return;
    }

    const copied = await copyToClipboard(shoppingListMarkdown);
    toast(copied ? COPY_SUCCESS_MESSAGE : COPY_FAILURE_MESSAGE);
  }, [shoppingListMarkdown]);

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
          height measured against BottomNav's. Copiar lista sits above Terminar compra, styled as
          a plain outline button so it reads as clearly secondary next to Terminar compra's solid
          primary fill. */}
      <div className="sticky bottom-24 z-10 -mx-4 mt-6 flex flex-col gap-2 border-t bg-background px-4 py-3">
        <button
          type="button"
          disabled={hasNothingToCopy}
          aria-label={hasNothingToCopy ? `Copiar lista. ${COPY_EMPTY_MESSAGE}` : undefined}
          onClick={() => void handleCopyList()}
          className="w-full rounded-lg border px-4 py-3 text-base font-semibold disabled:opacity-50"
        >
          Copiar lista
        </button>
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
