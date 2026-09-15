import "server-only";

import { eq } from "drizzle-orm";
import { isValidId } from "@/domain/ids";
import { db } from "./client";
import { categories, products } from "./schema";

export type ProductRow = { id: string; name: string; categoryId: string };

export async function listProducts(): Promise<ProductRow[]> {
  return db
    .select({ id: products.id, name: products.name, categoryId: products.categoryId })
    .from(products);
}

export async function insertProduct(name: string, normalizedName: string, categoryId: string): Promise<ProductRow> {
  const [product] = await db
    .insert(products)
    .values({ name, normalizedName, categoryId })
    .returning({ id: products.id, name: products.name, categoryId: products.categoryId });
  return product;
}

// Re-reads a Product and its Category by the Product's normalized name after a unique-constraint
// race (see src/db/pg-errors.ts), to build the duplicate message from the row that actually won.
export async function findProductWithCategoryByNormalizedName(
  normalizedName: string,
): Promise<{ product: ProductRow; category: { id: string; name: string } } | null> {
  const [row] = await db
    .select({
      productId: products.id,
      productName: products.name,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.normalizedName, normalizedName))
    .limit(1);

  if (!row) return null;
  return {
    product: { id: row.productId, name: row.productName, categoryId: row.categoryId },
    category: { id: row.categoryId, name: row.categoryName },
  };
}

// Preloads the Product being edited on the rename/move page; an unknown OR malformed id renders a
// not-found message rather than a 500 (see src/domain/ids.ts — Postgres rejects a malformed id
// with 22P02 before this even gets to check for "unknown", so the shape is validated first).
export async function findProductById(id: string): Promise<ProductRow | null> {
  if (!isValidId(id)) return null;

  const [product] = await db
    .select({ id: products.id, name: products.name, categoryId: products.categoryId })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return product ?? null;
}

// Renames a Product and/or moves it to a different Category in one write: the edit page's single
// form submits both at once (see src/app/productos/[id]/editar).
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
    .returning({ id: products.id, name: products.name, categoryId: products.categoryId });
  return product;
}
