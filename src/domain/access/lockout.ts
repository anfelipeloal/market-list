// Sign-in lockout: guessing PINs is limited per IP address and, as a backstop, globally across
// every IP. See ADR-0001 and docs/adr/0001-pin-only-authentication.md.
//
// Both rules share the same shape: sorted by time, whenever the Nth failure (from some starting
// point) lands within a fixed window of the failure (N - threshold + 1) earlier, sign-in is
// blocked until a fixed duration after that Nth failure. The block end is the latest such point
// across every qualifying group, because an attacker can keep re-triggering the rule.

export interface FailedAttempt {
  ip: string;
  at: Date;
}

export type LockoutStatus =
  | { status: "allowed" }
  | { status: "blocked"; reason: "ip" | "global"; retryAt: Date };

const IP_FAILURE_THRESHOLD = 5;
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_BLOCK_MS = 15 * 60 * 1000;

// "More than 30" means the 31st failure is what pauses sign-in.
const GLOBAL_FAILURE_THRESHOLD = 31;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_BLOCK_MS = 60 * 60 * 1000;

// Given failure times sorted ascending, returns the latest point at which sign-in becomes
// possible again, or null if the threshold is never reached within the window.
function latestBlockEnd(sortedTimes: number[], threshold: number, windowMs: number, blockMs: number): number | null {
  let latest: number | null = null;

  for (let i = threshold - 1; i < sortedTimes.length; i++) {
    const groupStart = sortedTimes[i - threshold + 1];
    const groupEnd = sortedTimes[i];
    if (groupEnd - groupStart <= windowMs) {
      const blockEnd = groupEnd + blockMs;
      if (latest === null || blockEnd > latest) latest = blockEnd;
    }
  }

  return latest;
}

// Applies one rule (IP or global) to its relevant failures and reports the instant sign-in
// becomes possible again, or null if `now` is not currently blocked by this rule.
function ruleStatus(
  failures: FailedAttempt[],
  threshold: number,
  windowMs: number,
  blockMs: number,
  nowMs: number,
): Date | null {
  const sortedTimes = failures.map((failure) => failure.at.getTime()).sort((a, b) => a - b);
  const blockEnd = latestBlockEnd(sortedTimes, threshold, windowMs, blockMs);
  return blockEnd !== null && nowMs < blockEnd ? new Date(blockEnd) : null;
}

// Decides whether a sign-in attempt from `ip` is allowed at `now`, given the failed attempts
// recorded recently enough to matter (the caller decides how far back to load; see
// src/db/sign-in-attempts.ts). `recentFailures` need not be sorted or pre-filtered by IP.
export function checkLockout(recentFailures: FailedAttempt[], ip: string, now: Date): LockoutStatus {
  const nowMs = now.getTime();
  const ipFailures = recentFailures.filter((failure) => failure.ip === ip);

  const active: Array<{ reason: "ip" | "global"; retryAt: Date }> = [];

  const ipRetryAt = ruleStatus(ipFailures, IP_FAILURE_THRESHOLD, IP_WINDOW_MS, IP_BLOCK_MS, nowMs);
  if (ipRetryAt) active.push({ reason: "ip", retryAt: ipRetryAt });

  const globalRetryAt = ruleStatus(recentFailures, GLOBAL_FAILURE_THRESHOLD, GLOBAL_WINDOW_MS, GLOBAL_BLOCK_MS, nowMs);
  if (globalRetryAt) active.push({ reason: "global", retryAt: globalRetryAt });

  if (active.length === 0) return { status: "allowed" };

  // When both apply, report whichever ends later so the message never understates the wait.
  const latest = active.reduce((later, candidate) => (candidate.retryAt > later.retryAt ? candidate : later));
  return { status: "blocked", reason: latest.reason, retryAt: latest.retryAt };
}

// Turns a remaining wait into whole minutes, rounded up, for the sign-in message: someone with
// 61 seconds left should be told 2 minutes, not 1.
export function minutesUntil(target: Date, now: Date): number {
  return Math.ceil((target.getTime() - now.getTime()) / 60_000);
}
