"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  findCategoryByNormalizedName,
  insertCategory,
  listCategories,
  updateCategoryName,
} from "@/db/categories";
import { isUniqueViolation } from "@/db/pg-errors";
import {
  findProductWithCategoryByNormalizedName,
  insertProduct,
  listProducts,
  updateProductNameAndCategory,
} from "@/db/products";
import { validateNewCategory } from "@/domain/catalog/create-category";
import { validateNewProduct } from "@/domain/catalog/create-product";
import { validateProductMove } from "@/domain/catalog/move-product";
import { validateCategoryRename } from "@/domain/catalog/rename-category";
import { validateProductRename } from "@/domain/catalog/rename-product";
import { requireUser } from "@/lib/session";

export type CreateCategoryState = { error: string } | undefined;

// Any signed-in User may create a Category (see ticket #6); only later tickets add role checks
// (e.g. deleting a Category is Admin-only, ticket #15).
export async function createCategory(_prevState: CreateCategoryState, formData: FormData): Promise<CreateCategoryState> {
  await requireUser();

  const rawName = String(formData.get("name") ?? "");
  const existingCategories = await listCategories();
  const result = validateNewCategory(rawName, existingCategories);

  if (result.outcome === "empty") {
    return { error: "Escribe un nombre." };
  }
  if (result.outcome === "duplicate") {
    return { error: `Ya existe la categoría ${result.existingCategory.name}.` };
  }

  try {
    await insertCategory(result.name, result.normalizedName);
  } catch (error) {
    // The domain check above already read the existing Categories, but a concurrent create could
    // have won the same name since; the unique constraint is the final guard (see
    // src/db/pg-errors.ts). Re-read the row that won to build the same duplicate message.
    if (!isUniqueViolation(error)) throw error;
    const existingCategory = await findCategoryByNormalizedName(result.normalizedName);
    if (!existingCategory) throw error;
    return { error: `Ya existe la categoría ${existingCategory.name}.` };
  }

  // The Despensa reads data via requireUser() + a plain select, with no explicit caching, but the
  // route is still revalidated so the Next.js router treats the response as fresh (see the
  // "Revalidate data" pattern in the Mutating Data guide).
  revalidatePath("/");
  return undefined;
}

export type CreateProductState = { error: string } | undefined;

export async function createProduct(_prevState: CreateProductState, formData: FormData): Promise<CreateProductState> {
  await requireUser();

  const rawName = String(formData.get("name") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const [existingCategories, existingProducts] = await Promise.all([listCategories(), listProducts()]);
  const result = validateNewProduct(rawName, categoryId, existingProducts, existingCategories);

  if (result.outcome === "empty") {
    return { error: "Escribe un nombre." };
  }
  if (result.outcome === "unknownCategory") {
    // Not one of the Spanish messages the ticket specifies: the Category comes from a <select>
    // populated with the real Categories, so this only fires if a request is tampered with.
    return { error: "Elige una categoría." };
  }
  if (result.outcome === "duplicate") {
    return { error: `${result.existingProduct.name} ya existe en ${result.existingCategory.name}.` };
  }

  try {
    await insertProduct(result.name, result.normalizedName, result.categoryId);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await findProductWithCategoryByNormalizedName(result.normalizedName);
    if (!existing) throw error;
    return { error: `${existing.product.name} ya existe en ${existing.category.name}.` };
  }

  revalidatePath("/");
  return undefined;
}

export type EditCategoryState = { error: string } | undefined;

// Any signed-in User may rename a Category (see ticket #7); role checks are out of scope until a
// later ticket adds Admin-only actions such as deletion.
export async function editCategory(_prevState: EditCategoryState, formData: FormData): Promise<EditCategoryState> {
  await requireUser();

  const categoryId = String(formData.get("categoryId") ?? "");
  const rawName = String(formData.get("name") ?? "");
  const existingCategories = await listCategories();
  const result = validateCategoryRename(categoryId, rawName, existingCategories);

  if (result.outcome === "notFound") {
    // The id comes from the edit page's own URL, so this only fires if the Category was removed
    // (out of scope, ticket #15) or the request was tampered with.
    return { error: "No encontramos esa categoría." };
  }
  if (result.outcome === "empty") {
    return { error: "Escribe un nombre." };
  }
  if (result.outcome === "duplicate") {
    return { error: `Ya existe la categoría ${result.existingCategory.name}.` };
  }

  try {
    await updateCategoryName(result.id, result.name, result.normalizedName);
  } catch (error) {
    // Same race guard as createCategory: a concurrent rename could have won the same name since
    // the domain check read the existing Categories.
    if (!isUniqueViolation(error)) throw error;
    const existingCategory = await findCategoryByNormalizedName(result.normalizedName);
    if (!existingCategory) throw error;
    return { error: `Ya existe la categoría ${existingCategory.name}.` };
  }

  revalidatePath("/");
  redirect("/");
}

export type EditProductState = { error: string } | undefined;

// Renames a Product and/or moves it to a different Category from the same form (see
// src/app/productos/[id]/editar): one "Guardar" submit validates and applies both at once, which
// is simpler for a User than two separate forms and avoids a rename succeeding while a move fails
// (or vice versa) from the same screen.
export async function editProduct(_prevState: EditProductState, formData: FormData): Promise<EditProductState> {
  await requireUser();

  const productId = String(formData.get("productId") ?? "");
  const rawName = String(formData.get("name") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const [existingProducts, existingCategories] = await Promise.all([listProducts(), listCategories()]);

  const renameResult = validateProductRename(productId, rawName, existingProducts, existingCategories);
  if (renameResult.outcome === "notFound") {
    return { error: "No encontramos ese producto." };
  }
  if (renameResult.outcome === "empty") {
    return { error: "Escribe un nombre." };
  }
  if (renameResult.outcome === "duplicate") {
    return { error: `${renameResult.existingProduct.name} ya existe en ${renameResult.existingCategory.name}.` };
  }

  const moveResult = validateProductMove(productId, categoryId, existingProducts, existingCategories);
  if (moveResult.outcome === "productNotFound") {
    return { error: "No encontramos ese producto." };
  }
  if (moveResult.outcome === "categoryNotFound") {
    // Not one of the Spanish messages the ticket specifies: the Category comes from a <select>
    // populated with the real Categories, so this only fires if a request is tampered with.
    return { error: "Elige una categoría." };
  }

  try {
    await updateProductNameAndCategory(renameResult.id, renameResult.name, renameResult.normalizedName, moveResult.categoryId);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await findProductWithCategoryByNormalizedName(renameResult.normalizedName);
    if (!existing) throw error;
    return { error: `${existing.product.name} ya existe en ${existing.category.name}.` };
  }

  revalidatePath("/");
  redirect("/");
}
