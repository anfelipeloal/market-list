"use server";

import { redirect } from "next/navigation";
import { isValidPin } from "@/domain/access/pin";
import { ensureFirstAdminExists, findUserByPinHash } from "@/db/users";
import { hashPin } from "@/lib/pin-hash";
import { createSessionCookie } from "@/lib/session";

export type SignInState = { error: string } | undefined;

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const pin = String(formData.get("pin") ?? "");

  if (!isValidPin(pin)) {
    return { error: "PIN incorrecto" };
  }

  // Bootstrapping happens on the sign-in path itself: the first person to submit a well-formed
  // PIN against an empty Household becomes the Admin, from FIRST_ADMIN_NAME / FIRST_ADMIN_PIN.
  // No manual seed step.
  await ensureFirstAdminExists();

  const user = await findUserByPinHash(hashPin(pin));
  if (!user) {
    return { error: "PIN incorrecto" };
  }

  await createSessionCookie(user.id);
  redirect("/");
}
