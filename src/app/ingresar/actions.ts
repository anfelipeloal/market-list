"use server";

import { redirect } from "next/navigation";
import { checkLockout, minutesUntil, type LockoutStatus } from "@/domain/access/lockout";
import { isValidPin } from "@/domain/access/pin";
import { findFailedAttemptsSince, recordSignInAttempt, withSignInLock } from "@/db/sign-in-attempts";
import { ensureFirstAdminExists, findUserByPinHash, type SignedInUser } from "@/db/users";
import { getClientIp } from "@/lib/client-ip";
import { hashPin } from "@/lib/pin-hash";
import { createSessionCookie } from "@/lib/session";

export type SignInState = { error: string } | undefined;

// The per-IP window is 15 minutes and its block lasts 15 more; the global window is 60 minutes
// and its pause lasts 60 more. Loading the last 2 hours of failures is enough headroom for the
// domain core to correctly decide either rule at the current instant, without querying more than
// once per attempt or re-implementing the rules' arithmetic in SQL.
const FAILURE_LOOKBACK_MS = 2 * 60 * 60 * 1000;

// What the locked transaction decided, so the redirect (which must not run inside the
// transaction) can happen afterwards.
type SignInOutcome =
  | { kind: "blocked"; lockout: Extract<LockoutStatus, { status: "blocked" }> }
  | { kind: "denied" }
  | { kind: "success"; user: SignedInUser };

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const ip = await getClientIp();
  const pin = String(formData.get("pin") ?? "");
  const now = new Date();

  // The whole read-decide-evaluate-record sequence runs inside one transaction serialized by an
  // advisory lock (see withSignInLock), so concurrent attempts from the same IP can't all read
  // the same stale failure count and all slip past the threshold together.
  const outcome = await withSignInLock<SignInOutcome>(async (tx) => {
    const recentFailures = await findFailedAttemptsSince(tx, new Date(now.getTime() - FAILURE_LOOKBACK_MS));
    const lockout = checkLockout(recentFailures, ip, now);
    if (lockout.status === "blocked") {
      // Rejected purely because of the block: the PIN itself is never evaluated, so nothing is
      // recorded here (otherwise a blocked IP could never accumulate the successes it needs to
      // recover, since every subsequent attempt would immediately fail again).
      return { kind: "blocked", lockout };
    }

    if (!isValidPin(pin)) {
      await recordSignInAttempt(tx, ip, false);
      return { kind: "denied" };
    }

    // Bootstrapping happens on the sign-in path itself: the first person to submit a well-formed
    // PIN against an empty Household becomes the Admin, from FIRST_ADMIN_NAME / FIRST_ADMIN_PIN.
    // No manual seed step.
    await ensureFirstAdminExists(tx);

    const user = await findUserByPinHash(tx, hashPin(pin));
    if (!user) {
      await recordSignInAttempt(tx, ip, false);
      return { kind: "denied" };
    }

    await recordSignInAttempt(tx, ip, true);
    return { kind: "success", user };
  });

  if (outcome.kind === "blocked") {
    return { error: lockoutMessage(outcome.lockout, now) };
  }
  if (outcome.kind === "denied") {
    return { error: "PIN incorrecto" };
  }

  // Session creation happens after the transaction has committed: it's a separate concern from
  // the lockout bookkeeping and doesn't need to hold the advisory lock.
  await createSessionCookie(outcome.user.id);
  redirect("/");
}

function lockoutMessage(lockout: Extract<LockoutStatus, { status: "blocked" }>, now: Date): string {
  const minutes = minutesUntil(lockout.retryAt, now);
  const unit = minutes === 1 ? "minuto" : "minutos";

  return lockout.reason === "ip"
    ? `Demasiados intentos. Intenta de nuevo en ${minutes} ${unit}.`
    : `El ingreso está pausado por seguridad. Intenta de nuevo en ${minutes} ${unit}.`;
}
