import "server-only";

import { headers } from "next/headers";

// Local development has no reverse proxy in front of Next.js, so there is no forwarded-for
// header to read; every request is attributed to this fixed value instead.
const UNKNOWN_IP = "unknown";

// Reads the caller's IP address as seen by the deployment platform's proxy. Used only by the
// sign-in lockout rules (src/domain/access/lockout.ts); nothing else in the app needs it.
export async function getClientIp(): Promise<string> {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();
  if (firstForwarded) return firstForwarded;

  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return UNKNOWN_IP;
}
