"use server";

import { revalidatePath } from "next/cache";
import { applyProductTransition, type ApplyProductTransitionResult } from "@/db/products";
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

function afterTransition(result: ApplyProductTransitionResult): ShoppingActionResult {
  if (result.outcome !== "moved") return { outcome: result.outcome };

  revalidatePath("/");
  revalidatePath("/lista");
  return { outcome: "ok" };
}
