"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshIndicator } from "../refresh-indicator";
import { finishTrip, resetShoppingList, toggleInCart, undoFinishTrip } from "../shopping-actions";
import { shoppingResultMessage } from "../shopping-messages";
import { useRefreshOnReturn } from "../use-refresh-on-return";
import { buildShoppingListView, type ShoppingListCategory } from "@/domain/shopping/shopping-list";
import { buildShoppingListMarkdown } from "@/domain/shopping/shopping-list-markdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShoppingListProductRow } from "./shopping-list-product-row";

const FINISH_TRIP_EMPTY_MESSAGE = "No hay productos en el carrito.";
const FINISH_TRIP_STALE_MESSAGE = "La lista cambió. Actualiza la página.";
const FINISH_TRIP_TOAST_ID = "finish-trip";
const COPY_TOAST_ID = "copy-shopping-list";
const UNDO_TIMEOUT_MS = 5000;

const COPY_SUCCESS_MESSAGE = "Lista copiada.";
const COPY_FAILURE_MESSAGE = "No pudimos copiar la lista.";
const COPY_EMPTY_MESSAGE = "No hay nada para copiar.";

const RESET_EMPTY_MESSAGE = "La lista de compras ya estaba vacía.";
const RESET_FORBIDDEN_MESSAGE = "Solo un administrador puede reiniciar la lista.";
const RESET_TOAST_ID = "reset-shopping-list";

// Reset (ticket #12) never offers undo (see CONTEXT.md), so its success message just reports how
// many Products moved, unlike finishTripMessage below which also names the destination screen
// implicitly through "Compra terminada".
function resetMessage(count: number): string {
  return count === 1
    ? "La lista de compras se reinició. 1 producto volvió a la despensa."
    : `La lista de compras se reinició. ${count} productos volvieron a la despensa.`;
}

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
export function ShoppingListView({
  shoppingList,
  isAdmin,
}: {
  shoppingList: ShoppingListCategory[];
  isAdmin: boolean;
}) {
  const [inCartOverrides, setInCartOverrides] = useState<ReadonlyMap<string, boolean>>(new Map());
  const [hiddenProductIds, setHiddenProductIds] = useState<ReadonlySet<string>>(new Set());
  const [isFinishingTrip, startFinishTripTransition] = useTransition();
  // "Reiniciar lista" (ticket #12) has its own pending flag: it disables its own button (and
  // closes its confirmation dialog) independently of Terminar compra, so a User can never trigger
  // both at once through either button.
  const [isResettingList, startResetTransition] = useTransition();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  // Guards "Deshacer" on the Finish Trip toast exactly like the per-Product undo in
  // pantry-search.tsx: a ref, not state, so a double tap is caught synchronously instead of
  // racing a re-render. There is at most one Finish Trip toast at a time, so a single boolean is
  // enough (unlike pantry-search's per-Product Set).
  const undoInFlight = useRef(false);
  const copyInFlight = useRef(false);

  // Refresh on return and pull-to-refresh (ticket #16): same mechanism and the same reasoning as
  // pantry-search.tsx's own use of useRefreshOnReturn, applied to this screen's two local
  // overrides instead of one; containerRef also wraps the "Lista de compras" heading (rendered
  // here, not in page.tsx) so a pull starting on the heading works too. Once the fresh
  // `shoppingList` prop has actually landed, and no mutation of our own set an override while that
  // refresh was in flight (see notifyMutation calls below and src/domain/refresh/mutation-guard.ts),
  // both overrides are cleared: a stale inCartOverrides entry could otherwise show a Product as In
  // Cart (or not) a moment after someone else genuinely changed it back, and a stale
  // hiddenProductIds entry (from this session's own earlier Finish Trip or Reset) could keep hiding
  // a Product that legitimately returned to the Shopping List under the same id before this
  // refresh.
  const handleRefreshed = useCallback(() => {
    setInCartOverrides(new Map());
    setHiddenProductIds(new Set());
  }, []);
  const { containerRef, isRefreshing, pull, notifyMutation } = useRefreshOnReturn(handleRefreshed);

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

  const handleToggle = useCallback(
    async (productId: string, currentlyInCart: boolean) => {
      const result = await toggleInCart(productId);
      if (result.outcome !== "ok") {
        toast(shoppingResultMessage(result.outcome));
        return;
      }
      notifyMutation();
      setInCartOverrides((prev) => new Map(prev).set(productId, !currentlyInCart));
    },
    [notifyMutation],
  );

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

    notifyMutation();
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
  }, [notifyMutation]);

  // Copiar lista (ticket #11): puts the still-needed Products as a markdown checklist on the
  // clipboard, grouped by Category, so they can be pasted into a chat. Read-only — it never calls
  // a server action, so it can never change a Product's status. The empty-list guard mirrors the
  // button's own `disabled`, in case assistive technology still triggers a tap on it (see the
  // button's aria-label below).
  const handleCopyList = useCallback(async () => {
    if (hasNothingToCopy) {
      toast(COPY_EMPTY_MESSAGE);
      return;
    }
    // A second tap while the first copy is still in flight would stack a duplicate toast.
    if (copyInFlight.current) return;
    copyInFlight.current = true;

    const copied = await copyToClipboard(shoppingListMarkdown);
    copyInFlight.current = false;
    toast(copied ? COPY_SUCCESS_MESSAGE : COPY_FAILURE_MESSAGE, { id: COPY_TOAST_ID });
  }, [hasNothingToCopy, shoppingListMarkdown]);

  const handleFinishTrip = useCallback(() => {
    startFinishTripTransition(async () => {
      const result = await finishTrip();
      if (result.outcome === "empty") {
        toast(FINISH_TRIP_EMPTY_MESSAGE);
        return;
      }

      const { affectedIds } = result;
      notifyMutation();
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
  }, [handleUndoFinishTrip, notifyMutation]);

  // Reiniciar lista (ticket #12, Admin-only): confirmed via the AlertDialog below rather than an
  // undo notification, since Reset has no undo (see CONTEXT.md). resetShoppingList() enforces the
  // Admin check server-side regardless of what isAdmin renders here (see shopping-actions.ts);
  // "forbidden" is only reachable in practice through a tampered/replayed request, since a
  // non-Admin never sees the button that opens this dialog. Closes the dialog itself on every
  // outcome — success, empty, or forbidden — so a second tap can't stack another request while one
  // is in flight (isResettingList's disabled state on both the trigger and the confirm button
  // covers the rest).
  const handleResetShoppingList = useCallback(() => {
    startResetTransition(async () => {
      const result = await resetShoppingList();
      setResetDialogOpen(false);

      if (result.outcome === "forbidden") {
        toast(RESET_FORBIDDEN_MESSAGE, { id: RESET_TOAST_ID });
        return;
      }
      // Both outcomes end with an empty Shopping List, so hide what is on screen either way:
      // "empty" means someone else already reset it and this screen is showing stale Products.
      const allProductIds = shoppingList.flatMap((category) => category.products.map((product) => product.id));
      notifyMutation();
      setHiddenProductIds((prev) => new Set([...prev, ...allProductIds]));

      if (result.outcome === "empty") {
        toast(RESET_EMPTY_MESSAGE, { id: RESET_TOAST_ID });
        return;
      }

      toast(resetMessage(result.count), { id: RESET_TOAST_ID });
    });
  }, [shoppingList, notifyMutation]);

  return (
    <div ref={containerRef}>
      <RefreshIndicator isRefreshing={isRefreshing} pull={pull} />
      <h1 className="text-2xl font-semibold tracking-tight">Lista de compras</h1>
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

        {/* Admin-only (ticket #12): hiding this from a non-Admin is only a courtesy — the real
            enforcement is resetShoppingList()'s requireAdmin() check on the server (see
            shopping-actions.ts). Styled as an outline button in the destructive color so it reads
            as clearly different from Terminar compra's primary fill and from Copiar lista's
            neutral outline, without the alarm of a solid destructive fill: Reset is guarded by the
            confirmation dialog below, not by looking dangerous. */}
        {isAdmin && (
          <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <AlertDialogTrigger
              disabled={isResettingList}
              className="w-full rounded-lg border border-destructive/40 px-4 py-3 text-base font-semibold text-destructive disabled:opacity-50"
            >
              Reiniciar lista
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos los productos de la lista de compras volverán a la despensa. Ningún producto se elimina.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResettingList}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isResettingList}
                  onClick={handleResetShoppingList}
                >
                  Reiniciar lista
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
