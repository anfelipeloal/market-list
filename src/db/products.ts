import "server-only";

import { and, eq } from "drizzle-orm";
import { isValidId } from "@/domain/ids";
import { transitionRule, type ShoppingTransition } from "@/domain/shopping/status";
import { db } from "./client";
import { categories, products } from "./schema";

export type ProductRow = { id: string; name: string; categoryId: string; status: "pantry" | "shopping_list" | "in_cart" };

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
// change is silently NOT applied, rather than clobbering whatever the other request set. A
// malformed id can never match a row either, but is checked first (see src/domain/ids.ts) so it
// is reported as "notFound" rather than folded into "stale".
export async function applyProductTransition(id: string, transition: ShoppingTransition): Promise<ApplyProductTransitionResult> {
  if (!isValidId(id)) return { outcome: "notFound" };

  const { from, to } = transitionRule(transition);
  const [product] = await db
    .update(products)
    .set({ status: to })
    .where(and(eq(products.id, id), eq(products.status, from)))
    .returning(PRODUCT_COLUMNS);

  if (!product) return { outcome: "stale" };
  return { outcome: "moved", product };
}
