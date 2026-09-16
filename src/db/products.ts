import "server-only";

import { and, eq, inArray, TransactionRollbackError } from "drizzle-orm";
import { dedupeValidIds, isValidId } from "@/domain/ids";
import { decideUndoFinishTrip } from "@/domain/shopping/finish-trip";
import { transitionRule, type ProductStatus, type ShoppingTransition } from "@/domain/shopping/status";
import { db } from "./client";
import { categories, products } from "./schema";

export type ProductRow = { id: string; name: string; categoryId: string; status: ProductStatus };

const PRODUCT_COLUMNS = {
  id: products.id,
  name: products.name,
  categoryId: products.categoryId,
  status: products.status,
};

export async function listProducts(): Promise<ProductRow[]> {
  return db.select(PRODUCT_COLUMNS).from(products);
}

// New Products always start in the Pantry (the column's default), so the caller never passes a
// status: nothing creates a Product directly on the Shopping List or In Cart.
export async function insertProduct(name: string, normalizedName: string, categoryId: string): Promise<ProductRow> {
  const [product] = await db.insert(products).values({ name, normalizedName, categoryId }).returning(PRODUCT_COLUMNS);
  return product;
}

// Re-reads a Product and its Category by the Product's normalized name after a unique-constraint
// race (see src/db/pg-errors.ts), to build the duplicate message (with the existing Product's
// status, see src/domain/catalog/create-product.ts) from the row that actually won.
export async function findProductWithCategoryByNormalizedName(
  normalizedName: string,
): Promise<{ product: ProductRow; category: { id: string; name: string } } | null> {
  const [row] = await db
    .select({
      productId: products.id,
      productName: products.name,
      categoryId: products.categoryId,
      productStatus: products.status,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.normalizedName, normalizedName))
    .limit(1);

  if (!row) return null;
  return {
    product: { id: row.productId, name: row.productName, categoryId: row.categoryId, status: row.productStatus },
    category: { id: row.categoryId, name: row.categoryName },
  };
}

// Preloads the Product being edited on the rename/move page; an unknown OR malformed id renders a
// not-found message rather than a 500 (see src/domain/ids.ts — Postgres rejects a malformed id
// with 22P02 before this even gets to check for "unknown", so the shape is validated first).
export async function findProductById(id: string): Promise<ProductRow | null> {
  if (!isValidId(id)) return null;

  const [product] = await db.select(PRODUCT_COLUMNS).from(products).where(eq(products.id, id)).limit(1);
  return product ?? null;
}

// Renames a Product and/or moves it to a different Category in one write: the edit page's single
// form submits both at once (see src/app/(app)/productos/[id]/editar).
export async function updateProductNameAndCategory(
  id: string,
  name: string,
  normalizedName: string,
  categoryId: string,
): Promise<ProductRow> {
  if (!isValidId(id)) {
    // The caller (editProduct) only reaches here with an id it just matched against the Products
    // it read, so a malformed id is unreachable in practice; this guard keeps every by-id write
    // behind the same shape check as the reads instead of trusting the caller.
    throw new Error(`updateProductNameAndCategory called with a malformed id: ${JSON.stringify(id)}`);
  }

  const [product] = await db
    .update(products)
    .set({ name, normalizedName, categoryId })
    .where(eq(products.id, id))
    .returning(PRODUCT_COLUMNS);
  return product;
}

export type ApplyProductTransitionResult =
  | { outcome: "moved"; product: ProductRow }
  | { outcome: "stale" }
  | { outcome: "notFound" };

// Performs a named Shopping transition (see src/domain/shopping/status.ts) as a single
// conditional UPDATE: WHERE id = id AND status = <the transition's expected starting status>.
// This is the race guard for status changes: if another request changed this Product's status
// between the caller deciding to act and this UPDATE running, zero rows are affected and the
// change is silently NOT applied, rather than clobbering whatever the other request set. The
// conditional UPDATE is the atomic guard against that race; it alone can't tell "no such Product"
// apart from "found, but not in the expected status", since both affect zero rows the same way.
// A malformed id never matches a row either, so it short-circuits to "notFound" without a query.
export async function applyProductTransition(id: string, transition: ShoppingTransition): Promise<ApplyProductTransitionResult> {
  if (!isValidId(id)) return { outcome: "notFound" };

  const { from, to } = transitionRule(transition);
  const [product] = await db
    .update(products)
    .set({ status: to })
    .where(and(eq(products.id, id), eq(products.status, from)))
    .returning(PRODUCT_COLUMNS);

  if (product) return { outcome: "moved", product };

  // Zero rows affected: a follow-up read (outside the atomic guard, which has already done its
  // job) tells apart the two possible reasons, so the caller can show the right message.
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
  return existing ? { outcome: "stale" } : { outcome: "notFound" };
}

// Toggles a Product between the Shopping List and In Cart (ticket #10): tapping its row on the
// Lista de compras checks it off, tapping it again undoes that. The caller only knows the
// Product's id, not which direction to go, so this reads the current status first to pick the
// matching transition (markInCart or unmarkInCart) and then applies it exactly like any other
// Shopping transition, through applyProductTransition's own conditional UPDATE. That UPDATE, not
// this preliminary read, is what actually guards against a concurrent change: if the status
// changed between the read and the write, the conditional UPDATE simply affects zero rows and
// applyProductTransition reports stale/notFound the same way it does for every other transition.
// A Product that is neither on the Shopping List nor In Cart (e.g. someone ran Finish Trip on it,
// or Reset, in the moment between page load and this tap) has nothing to toggle, so that's
// reported as stale too: the row the User tapped no longer reflects the Product's real status.
export async function toggleProductInCart(id: string): Promise<ApplyProductTransitionResult> {
  if (!isValidId(id)) return { outcome: "notFound" };

  const [existing] = await db.select({ status: products.status }).from(products).where(eq(products.id, id)).limit(1);
  if (!existing) return { outcome: "notFound" };

  const transition: ShoppingTransition | null =
    existing.status === "shopping_list" ? "markInCart" : existing.status === "in_cart" ? "unmarkInCart" : null;
  if (!transition) return { outcome: "stale" };

  return applyProductTransition(id, transition);
}

// Finish Trip (ticket #10): returns every In Cart Product to the Pantry in a single atomic
// statement (a single UPDATE is atomic on its own; no explicit transaction is needed since there
// is only one statement). Reads its (from, to) pair from the shared transition table rather than
// hardcoding the two status literals, so that table stays the single source of truth for every
// Shopping status change. Returns the ids actually affected — exactly the Products that were In
// Cart a moment ago — which the caller shows in the undo notification and passes to
// undoFinishTrip if the User taps "Deshacer". Anything not In Cart (still needed, or already in
// the Pantry) is untouched: the WHERE clause never matches those rows.
export async function finishTrip(): Promise<string[]> {
  const { from, to } = transitionRule("finishTrip");
  const rows = await db
    .update(products)
    .set({ status: to })
    .where(eq(products.status, from))
    .returning({ id: products.id });
  return rows.map((row) => row.id);
}

export type UndoFinishTripResult = { outcome: "ok" } | { outcome: "stale" };

// Undo of Finish Trip (ticket #10): puts exactly the Products Finish Trip just returned to the
// Pantry back In Cart, all-or-nothing. dedupeValidIds cleans the ids first (they arrive from the
// browser via a server action rather than from a query this module trusts): a malformed one is
// dropped rather than reaching Postgres, which would otherwise reject the whole statement with
// 22P02, and a duplicate never counts twice. An empty result is a no-op.
//
// The conditional UPDATE (WHERE id IN (...) AND status = 'pantry') is the same atomic guard as
// applyProductTransition's, just widened to many ids at once: if a Product among them was changed
// by someone else in the meantime (e.g. moved back onto the Shopping List directly), it won't
// match. Whether that's enough to proceed is decideUndoFinishTrip's call (the pure, unit-tested
// half of this decision, see src/domain/shopping/finish-trip.ts) — it gets a minimal {id, status}
// view built from what this UPDATE's own RETURNING already determined (a returned id was `from`
// a moment ago; any other requested id provably was not, or the WHERE clause would have matched
// it), so no separate read is added just to re-derive what this statement already knows. Because
// this must be all-or-nothing rather than "restore whichever ones still match", a stale decision
// rolls back the whole transaction via tx.rollback() (which rejects db.transaction()'s promise
// with TransactionRollbackError) instead of leaving a partial restore in place.
export async function undoFinishTrip(productIds: readonly string[]): Promise<UndoFinishTripResult> {
  const candidateIds = dedupeValidIds(productIds);
  if (candidateIds.length === 0) return { outcome: "ok" };

  const { from, to } = transitionRule("undoFinishTrip");
  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .update(products)
        .set({ status: to })
        .where(and(inArray(products.id, candidateIds), eq(products.status, from)))
        .returning({ id: products.id });

      const matchedIds = new Set(rows.map((row) => row.id));
      const currentStatuses = candidateIds.map((id) => ({ id, status: matchedIds.has(id) ? from : to }));
      const decision = decideUndoFinishTrip(candidateIds, currentStatuses);

      if (decision.outcome === "stale") {
        tx.rollback();
      }
    });
    return { outcome: "ok" };
  } catch (error) {
    if (error instanceof TransactionRollbackError) return { outcome: "stale" };
    throw error;
  }
}
