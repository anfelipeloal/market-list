"use server";

import { redirect } from "next/navigation";
import { endSession } from "@/lib/session";

// Cerrar sesión (no ticket, requested directly; see src/app/(app)/app-header.tsx, the header this
// backs). Ends this browser's own Session (endSession, src/lib/session.ts) and always lands on the
// PIN screen afterwards -- the same destination requireUser() itself sends every signed-out
// browser to (src/lib/session.ts), so a signed-out User sees exactly what they'd see if their
// Session had simply expired. No confirmation dialog (re-entering a 4-digit PIN is cheap) and no
// success toast (the redirect leaves the screen a toast would show on -- landing on /ingresar is
// the only feedback this needs).
export async function signOut(): Promise<never> {
  await endSession();
  redirect("/ingresar");
}
