import "server-only";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { FailedAttempt } from "@/domain/access/lockout";
import { db, type Tx } from "./client";
import { signInAttempts } from "./schema";

const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

// Arbitrary fixed key namespacing this app's sign-in serialization lock (see withSignInLock).
// Any 63-bit integer works here; it only has to be constant and not reused for another lock.
const SIGN_IN_LOCK_KEY = 20_260_005;

// Runs `run` inside one transaction serialized by a transaction-scoped Postgres advisory lock,
// so concurrent sign-in attempts are processed strictly one at a time. Without this, N
// concurrent requests from the same IP could all read the same stale failure count, all get
// their PIN evaluated, and all slip past a threshold that should have blocked everyone after the
// first N-1 (see src/app/ingresar/actions.ts, which is the only caller: it reads recent
// failures, decides, evaluates the PIN and records the outcome all inside this one lock).
//
// The lock is transaction-scoped (`pg_advisory_xact_lock`, not the session-scoped
// `pg_advisory_lock`) because it is released automatically at commit or rollback; a
// session-scoped lock would depend on explicitly unlocking the same physical connection, which
// Supabase's pooler in transaction mode does not guarantee stays associated with this request.
export async function withSignInLock<T>(run: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${SIGN_IN_LOCK_KEY})`);
    return run(tx);
  });
}

// Records one sign-in attempt whose PIN was actually evaluated (see src/app/ingresar/actions.ts
// for what counts as evaluated). Opportunistically prunes attempts older than 24 hours first, so
// the table never grows unbounded from a low-traffic Household without needing a separate job.
// Must run inside the same withSignInLock transaction as the read that decided to evaluate the
// PIN, or the recorded count could race with a concurrent attempt.
export async function recordSignInAttempt(tx: Tx, ip: string, succeeded: boolean): Promise<void> {
  const cutoff = new Date(Date.now() - ATTEMPT_RETENTION_MS);
  await tx.delete(signInAttempts).where(lt(signInAttempts.attemptedAt, cutoff));
  await tx.insert(signInAttempts).values({ ip, succeeded });
}

// Loads the failed attempts recorded since `since`, for the lockout domain core to decide
// whether the current attempt is allowed. Only failures matter: a lockout is about failures,
// never successes. Must run inside the same withSignInLock transaction as the eventual
// recordSignInAttempt call for that serialization to mean anything.
export async function findFailedAttemptsSince(tx: Tx, since: Date): Promise<FailedAttempt[]> {
  return tx
    .select({ ip: signInAttempts.ip, at: signInAttempts.attemptedAt })
    .from(signInAttempts)
    .where(and(eq(signInAttempts.succeeded, false), gte(signInAttempts.attemptedAt, since)));
}
