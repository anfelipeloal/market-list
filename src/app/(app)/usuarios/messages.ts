// Shared Spanish copy for the Usuarios screen and its actions (ticket #13): shown wherever a
// non-Admin is refused, whether that's the screen itself (page.tsx, [id]/editar/page.tsx), an
// action's typed result (actions.ts), or a toast reacting to one (user-row.tsx). One constant
// instead of four separate copies of the same string, so it can never drift between them — the
// same reasoning as shopping-messages.ts's shared copy. requireAdmin() (src/lib/session.ts) is the
// actual enforcement everywhere this is shown; hiding a button or a nav entry from a non-Admin is
// only ever a courtesy.
export const ADMIN_ONLY_MESSAGE = "Solo un administrador puede administrar usuarios.";

// Shown whenever a User id given to an action no longer matches any User (ticket #13's rename,
// #14's Change PIN and role toggles): the edit page's own not-found fallback, renameUser's and
// changePin's error, and removeUser's/grantAdmin's/revokeAdmin's "notFound" outcome (see
// userActionRefusalMessage below) all point at this one constant instead of repeating the string.
export const USER_NOT_FOUND_MESSAGE = "No encontramos ese usuario.";

const LAST_ADMIN_MESSAGE = "Debe quedar al menos un administrador.";

// The three refusal outcomes shared by every Usuarios action that can fail server-side
// (removeUser, grantAdmin, revokeAdmin, changePin — all in ./actions.ts), besides each action's
// own "ok" and any outcome specific to it (e.g. changePin's invalidPin/duplicatePin): a User no
// longer exists, the acting User isn't an Admin, or the change would leave the Household without
// one. Not every action's result type has all three (changePin and grantAdmin never have
// "lastAdmin"), but TypeScript accepts passing a narrower union to this wider parameter.
export type UserActionRefusal = "forbidden" | "notFound" | "lastAdmin";

// Maps a refusal outcome to its Spanish message — the same outcome-to-message mapper pattern as
// shoppingResultMessage (src/app/(app)/shopping-messages.ts) — so the "ok / forbidden / lastAdmin /
// notFound" cascade in removeUser's, grantAdmin's, revokeAdmin's and changePin's callers
// (user-row.tsx, [id]/editar/change-pin-form.tsx) reads the message from one place instead of
// repeating the same three strings four times. Each caller still handles its own "ok" (and, for
// changePin, invalidPin/duplicatePin) directly, since those carry action-specific side effects or
// copy this mapper doesn't know about.
export function userActionRefusalMessage(outcome: UserActionRefusal): string {
  if (outcome === "forbidden") return ADMIN_ONLY_MESSAGE;
  if (outcome === "lastAdmin") return LAST_ADMIN_MESSAGE;
  return USER_NOT_FOUND_MESSAGE;
}
