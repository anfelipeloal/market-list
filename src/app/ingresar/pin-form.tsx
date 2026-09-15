"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function PinForm() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action} className="mt-6 flex w-full flex-col items-center gap-4">
      <label htmlFor="pin" className="sr-only">
        PIN
      </label>
      <input
        id="pin"
        name="pin"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={4}
        required
        autoFocus
        aria-describedby={state?.error ? "pin-error" : undefined}
        className="w-40 rounded-xl border bg-card px-4 py-3 text-center text-3xl tracking-[0.5em]"
      />
      {state?.error ? (
        <p id="pin-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-50"
      >
        Entrar
      </button>
    </form>
  );
}
