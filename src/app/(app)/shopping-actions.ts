"use server";

import { revalidatePath } from "next/cache";
import {
  applyProductTransition,
  finishTrip as finishTripInDb,
  toggleProductInCart,
  undoFinishTrip as undoFinishTripInDb,
  type ApplyProductTransitionResult,
} from "@/db/products";
import { requireUser } from "@/lib/session";

export type ShoppingActionResult = { outcome: "ok" } | { outcome: "stale" } | { outcome: "notFound" };

// Moves a Product from the Pantry to the Shopping List (ticket #9). Any signed-in User may do
// this; there is no role check (see ADR-0001 and CONTEXT.md — Admin-only actions are a later
// ticket). Revalidates both screens that show a Product's status: the Despensa, which the Product
// leaves, and the Lista de compras, which it joins.
export async function moveToShoppingList(productId: string): Promise<ShoppingActionResult> {
  await requireUser();
  return afterTransition(await applyProductTransition(productId, "moveToShoppingList"));
}

// Returns a Product to the Pantry: the undo of moveToShoppingList, offered for about 5 seconds
// after a move (see src/app/(app)/pantry-search.tsx and product-form.tsx).
export async function returnToPantry(productId: string): Promise<ShoppingActionResult> {
  await requireUser();
  return afterTransition(await applyProductTransition(productId, "returnToPantry"));
}

// Toggles a Product between the Shopping List and In Cart (ticket #10): a tap on its row in
// src/app/(app)/lista/shopping-list-product-row.tsx checks it off, a second tap on the same row
// undoes that. Any signed-in User may do this. Unlike moveToShoppingList/returnToPantry there is
// no separate undo action or notification: the toggle IS its own undo, so the caller never shows
// one for it (see src/app/(app)/lista/shopping-list-view.tsx).
export async function toggleInCart(productId: string): Promise<ShoppingActionResult> {
  await requireUser();
  return afterTransition(await toggleProductInCart(productId));
}

function afterTransition(result: ApplyProductTransitionResult): ShoppingActionResult {
  if (result.outcome !== "moved") return { outcome: result.outcome };

  revalidatePath("/");
  revalidatePath("/lista");
  return { outcome: "ok" };
}

export type FinishTripResult = { outcome: "ok"; affectedIds: string[] } | { outcome: "empty" };

// Finish Trip (ticket #10): returns every In Cart Product to the Pantry. Available to every
// signed-in User, not just an Admin (see CONTEXT.md — Finish Trip is not one of the Admin-only
// actions). When nothing is In Cart, nothing changes and the caller shows "No hay productos en el
// carrito." instead of an undo notification with nothing to undo.
export async function finishTrip(): Promise<FinishTripResult> {
  await requireUser();
  const affectedIds = await finishTripInDb();
  if (affectedIds.length === 0) return { outcome: "empty" };

  revalidatePath("/");
  revalidatePath("/lista");
  return { outcome: "ok", affectedIds };
}

export type UndoFinishTripResult = { outcome: "ok" } | { outcome: "stale" };

// Undo of Finish Trip, offered for about 5 seconds after Finish Trip succeeds. All-or-nothing: see
// src/db/products.ts#undoFinishTrip for the transaction that enforces this.
export async function undoFinishTrip(productIds: string[]): Promise<UndoFinishTripResult> {
  await requireUser();
  const result = await undoFinishTripInDb(productIds);
  if (result.outcome !== "ok") return result;

  revalidatePath("/");
  revalidatePath("/lista");
  return result;
}
