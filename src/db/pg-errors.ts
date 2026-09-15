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

export type UniqueWriteResult<TWrite, TExisting> =
  | { outcome: "written"; value: TWrite }
  | { outcome: "duplicate"; existing: TExisting };

// Shared shape for every create/edit action that inserts or updates a uniquely-named row: attempt
// the write, and if it loses a race to a unique constraint, re-read the row that won so the
// caller can build its duplicate message from it (see src/app/actions.ts, which used to repeat
// this try/catch/re-read block once per action). If the constraint was violated but the
// supposedly-winning row can't be found (the race guard's own edge case), the original error is
// rethrown rather than swallowed.
export async function writeUniqueOrDuplicate<TWrite, TExisting>(params: {
  write: () => Promise<TWrite>;
  findExisting: () => Promise<TExisting | null>;
}): Promise<UniqueWriteResult<TWrite, TExisting>> {
  try {
    const value = await params.write();
    return { outcome: "written", value };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await params.findExisting();
    if (!existing) throw error;
    return { outcome: "duplicate", existing };
  }
}
