import "server-only";

import { eq } from "drizzle-orm";
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
