// Shared Spanish copy for the Catalog screens and their actions (ticket #15, extending the
// "outcome-to-message" mapper pattern from shoppingResultMessage, ./shopping-messages.ts, and
// userActionRefusalMessage, ./usuarios/messages.ts): one home for this copy instead of it drifting
// between the two delete buttons (categorias/[id]/editar/delete-category-button.tsx,
// productos/[id]/editar/delete-product-button.tsx), the actions they call (./actions.ts), and the
// edit pages' own not-found fallbacks. requireAdmin() (src/lib/session.ts) is the actual
// enforcement everywhere CATALOG_ADMIN_ONLY_MESSAGE is shown; hiding a delete button from a
// non-Admin is only ever a courtesy.
export const CATALOG_ADMIN_ONLY_MESSAGE = "Solo un administrador puede eliminar productos y categorías.";

// Shown whenever a Category id given to an action no longer matches any row (editCategory's rename,
// deleteCategory's deletion — both in ./actions.ts — and categorias/[id]/editar/page.tsx's own
// fallback).
export const CATEGORY_NOT_FOUND_MESSAGE = "No encontramos esa categoría.";

// Shown whenever a Product id given to an action no longer matches any row (editProduct's rename,
// deleteProduct's deletion — both in ./actions.ts — and productos/[id]/editar/page.tsx's own
// fallback).
export const PRODUCT_NOT_FOUND_MESSAGE = "No encontramos ese producto.";

const CATEGORY_HAS_PRODUCTS_MESSAGE = "No puedes eliminar una categoría que tiene productos.";

export type DeleteCategoryRefusal = "forbidden" | "hasProducts" | "notFound";

// Maps deleteCategory's (./actions.ts) refusal outcomes to their Spanish message, read by
// delete-category-button.tsx's toast.
export function deleteCategoryRefusalMessage(outcome: DeleteCategoryRefusal): string {
  if (outcome === "forbidden") return CATALOG_ADMIN_ONLY_MESSAGE;
  if (outcome === "hasProducts") return CATEGORY_HAS_PRODUCTS_MESSAGE;
  return CATEGORY_NOT_FOUND_MESSAGE;
}

export type DeleteProductRefusal = "forbidden" | "notFound";

// Maps deleteProduct's (./actions.ts) refusal outcomes to their Spanish message, read by
// delete-product-button.tsx's toast.
export function deleteProductRefusalMessage(outcome: DeleteProductRefusal): string {
  return outcome === "forbidden" ? CATALOG_ADMIN_ONLY_MESSAGE : PRODUCT_NOT_FOUND_MESSAGE;
}
