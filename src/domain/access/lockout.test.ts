import { describe, expect, it } from "vitest";
import { checkLockout, minutesUntil, type FailedAttempt } from "./lockout";

const IP_A = "203.0.113.10";
const T0 = new Date("2026-01-01T00:00:00.000Z").getTime();
const MIN = 60_000;

function at(offsetMs: number): Date {
  return new Date(T0 + offsetMs);
}

describe("Per-IP lockout window", () => {
  it("allows a 4th failure: the threshold is not yet reached", () => {
    const failures = [
      { ip: IP_A, at: at(0) },
      { ip: IP_A, at: at(3 * MIN) },
      { ip: IP_A, at: at(6 * MIN) },
      { ip: IP_A, at: at(9 * MIN) },
    ];

    expect(checkLockout(failures, IP_A, at(9 * MIN))).toEqual({ status: "allowed" });
  });

  it("blocks the IP once its 5th failure lands within 15 minutes of its 1st", () => {
    const failures = [
      { ip: IP_A, at: at(0) },
      { ip: IP_A, at: at(3 * MIN) },
      { ip: IP_A, at: at(6 * MIN) },
      { ip: IP_A, at: at(9 * MIN) },
      { ip: IP_A, at: at(14 * MIN) },
    ];

    const result = checkLockout(failures, IP_A, at(14 * MIN));

    expect(result).toEqual({
      status: "blocked",
      reason: "ip",
      retryAt: at(14 * MIN + 15 * MIN),
    });
  });

  it("allows sign-in when the 5 failures are spread over 15 minutes and 1 millisecond", () => {
    const fifthAt = 15 * MIN + 1;
    const failures = [
      { ip: IP_A, at: at(0) },
      { ip: IP_A, at: at(3 * MIN) },
      { ip: IP_A, at: at(6 * MIN) },
      { ip: IP_A, at: at(9 * MIN) },
      { ip: IP_A, at: at(fifthAt) },
    ];

    expect(checkLockout(failures, IP_A, at(fifthAt))).toEqual({ status: "allowed" });
  });

  it("is blocked 1 millisecond before the block end, and allowed exactly at it", () => {
    const fifthAt = 14 * MIN;
    const failures = [
      { ip: IP_A, at: at(0) },
      { ip: IP_A, at: at(3 * MIN) },
      { ip: IP_A, at: at(6 * MIN) },
      { ip: IP_A, at: at(9 * MIN) },
      { ip: IP_A, at: at(fifthAt) },
    ];
    const blockEnd = fifthAt + 15 * MIN;

    expect(checkLockout(failures, IP_A, at(blockEnd - 1))).toEqual({
      status: "blocked",
      reason: "ip",
      retryAt: at(blockEnd),
    });
    expect(checkLockout(failures, IP_A, at(blockEnd))).toEqual({ status: "allowed" });
  });

  // Guard: the window is inclusive at exactly 15 minutes (the AC's own wording, "within 15
  // minutes"), distinct from the 14-minute case above and the 15-minutes-and-1ms case below.
  it("blocks the IP when its 5 failures span exactly 15 minutes", () => {
    const fifthAt = 15 * MIN;
    const failures = [
      { ip: IP_A, at: at(0) },
      { ip: IP_A, at: at(3 * MIN) },
      { ip: IP_A, at: at(6 * MIN) },
      { ip: IP_A, at: at(9 * MIN) },
      { ip: IP_A, at: at(fifthAt) },
    ];

    expect(checkLockout(failures, IP_A, at(fifthAt))).toEqual({
      status: "blocked",
      reason: "ip",
      retryAt: at(fifthAt + 15 * MIN),
    });
  });

  it("is not blocked by 5 failures from a different IP", () => {
    const otherIp = "203.0.113.99";
    const failures = [
      { ip: otherIp, at: at(0) },
      { ip: otherIp, at: at(3 * MIN) },
      { ip: otherIp, at: at(6 * MIN) },
      { ip: otherIp, at: at(9 * MIN) },
      { ip: otherIp, at: at(14 * MIN) },
    ];

    expect(checkLockout(failures, IP_A, at(14 * MIN))).toEqual({ status: "allowed" });
  });
});

describe("Global sign-in pause window", () => {
  // Each failure comes from its own IP, spaced 1 minute apart, so only the global count can
  // possibly trigger a block: no single IP ever reaches its own 5-failure threshold.
  function failuresAcrossManyIps(count: number, stepMs: number): FailedAttempt[] {
    return Array.from({ length: count }, (_, i) => ({ ip: `203.0.113.${i}`, at: at(i * stepMs) }));
  }

  it("allows sign-in after 30 failures within 60 minutes: the threshold is more than 30", () => {
    const failures = failuresAcrossManyIps(30, MIN);

    expect(checkLockout(failures, IP_A, at(29 * MIN))).toEqual({ status: "allowed" });
  });

  it("pauses sign-in for every IP once the 31st failure lands within 60 minutes of the 1st", () => {
    const failures = failuresAcrossManyIps(31, MIN);

    const result = checkLockout(failures, IP_A, at(30 * MIN));

    expect(result).toEqual({
      status: "blocked",
      reason: "global",
      retryAt: at(30 * MIN + 60 * MIN),
    });
  });

  // Guard: the window is inclusive at exactly 60 minutes, and exclusive 1 ms past it, mirroring
  // the per-IP 15-minute boundary tests above.
  it("blocks everyone when the 31 failures span exactly 60 minutes", () => {
    const thirtyFirstAt = 60 * MIN;
    const failures = failuresAcrossManyIps(30, MIN).concat({ ip: "203.0.113.30", at: at(thirtyFirstAt) });

    expect(checkLockout(failures, IP_A, at(thirtyFirstAt))).toEqual({
      status: "blocked",
      reason: "global",
      retryAt: at(thirtyFirstAt + 60 * MIN),
    });
  });

  it("allows sign-in when the 31 failures span 60 minutes and 1 millisecond", () => {
    const thirtyFirstAt = 60 * MIN + 1;
    const failures = failuresAcrossManyIps(30, MIN).concat({ ip: "203.0.113.30", at: at(thirtyFirstAt) });

    expect(checkLockout(failures, IP_A, at(thirtyFirstAt))).toEqual({ status: "allowed" });
  });

  it("ends exactly 60 minutes after the 31st failure", () => {
    const failures = failuresAcrossManyIps(31, MIN);
    const blockEnd = 30 * MIN + 60 * MIN;

    expect(checkLockout(failures, IP_A, at(blockEnd - 1))).toEqual({
      status: "blocked",
      reason: "global",
      retryAt: at(blockEnd),
    });
    expect(checkLockout(failures, IP_A, at(blockEnd))).toEqual({ status: "allowed" });
  });
});

describe("Lockout precedence", () => {
  it("reports the global pause when it ends later than the IP's own block", () => {
    // All 31 failures come from IP_A itself, 1 minute apart: its own last 5 both cross the
    // per-IP threshold and complete the global threshold at the same instant. Because the
    // global block (60 min) outlasts the IP block (15 min) from that same instant, global wins.
    const failures = Array.from({ length: 31 }, (_, i) => ({ ip: IP_A, at: at(i * MIN) }));

    const result = checkLockout(failures, IP_A, at(30 * MIN));

    expect(result).toEqual({
      status: "blocked",
      reason: "global",
      retryAt: at(30 * MIN + 60 * MIN),
    });
  });

  it("reports the IP block when it ends later than the global pause", () => {
    const fillerIp = "203.0.113.201";
    // 31 filler failures spread across the full 60-minute global window, ending at T0.
    const fillerFailures = Array.from({ length: 31 }, (_, i) => ({
      ip: fillerIp,
      at: at(i * 2 * MIN - 60 * MIN),
    }));
    // IP_A fails 5 times on its own, well after the filler burst, so the gap to any filler
    // failure exceeds 60 minutes and cannot extend the global pause further.
    const ipFailures = Array.from({ length: 5 }, (_, i) => ({ ip: IP_A, at: at(46 * MIN + i * MIN) }));
    const failures = [...fillerFailures, ...ipFailures];

    const result = checkLockout(failures, IP_A, at(55 * MIN));

    expect(result).toEqual({
      status: "blocked",
      reason: "ip",
      retryAt: at(50 * MIN + 15 * MIN),
    });
  });
});

describe("Minutes remaining (for the sign-in message)", () => {
  it("returns 0 remaining minutes when the target is now", () => {
    expect(minutesUntil(at(0), at(0))).toBe(0);
  });

  it("returns exactly N minutes when N minutes remain exactly", () => {
    expect(minutesUntil(at(12 * MIN), at(0))).toBe(12);
  });

  it("rounds up any partial minute", () => {
    expect(minutesUntil(at(12 * MIN + 1), at(0))).toBe(13);
  });
});
