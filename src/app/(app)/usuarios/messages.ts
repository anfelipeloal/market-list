// Shared Spanish copy for the Usuarios screen and its actions (ticket #13): shown wherever a
// non-Admin is refused, whether that's the screen itself (page.tsx, [id]/editar/page.tsx), an
// action's typed result (actions.ts), or a toast reacting to one (user-row.tsx). One constant
// instead of four separate copies of the same string, so it can never drift between them — the
// same reasoning as shopping-messages.ts's shared copy. requireAdmin() (src/lib/session.ts) is the
// actual enforcement everywhere this is shown; hiding a button or a nav entry from a non-Admin is
// only ever a courtesy.
export const ADMIN_ONLY_MESSAGE = "Solo un administrador puede administrar usuarios.";
