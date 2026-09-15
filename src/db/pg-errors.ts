import "server-only";

import postgres from "postgres";

// https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = "23505";

// True when `error` is a Postgres unique constraint violation. Query modules that insert a
// Category or Product name rely on this as the final race guard: the domain core already checked
// for a duplicate against the rows it read, but a concurrent insert can still win the same name
// between that read and this insert, so the unique constraint is what actually prevents two rows
// with the same normalized name (see src/app/actions.ts).
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof postgres.PostgresError && error.code === UNIQUE_VIOLATION;
}
