import "server-only";

import { and, eq, gte, lt } from "drizzle-orm";
import type { FailedAttempt } from "@/domain/access/lockout";
import { db } from "./client";
import { signInAttempts } from "./schema";

const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

// Records one sign-in attempt whose PIN was actually evaluated (see src/app/ingresar/actions.ts
// for what counts as evaluated). Opportunistically prunes attempts older than 24 hours first, so
// the table never grows unbounded from a low-traffic Household without needing a separate job.
export async function recordSignInAttempt(ip: string, succeeded: boolean): Promise<void> {
  const cutoff = new Date(Date.now() - ATTEMPT_RETENTION_MS);
  await db.delete(signInAttempts).where(lt(signInAttempts.attemptedAt, cutoff));
  await db.insert(signInAttempts).values({ ip, succeeded });
}

// Loads the failed attempts recorded since `since`, for the lockout domain core to decide
// whether the current attempt is allowed. Only failures matter: a lockout is about failures,
// never successes.
export async function findFailedAttemptsSince(since: Date): Promise<FailedAttempt[]> {
  return db
    .select({ ip: signInAttempts.ip, at: signInAttempts.attemptedAt })
    .from(signInAttempts)
    .where(and(eq(signInAttempts.succeeded, false), gte(signInAttempts.attemptedAt, since)));
}
