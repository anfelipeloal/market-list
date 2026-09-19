"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { createUser, type CreateUserState } from "./actions";

// "Nuevo usuario" (ticket #13, Admin-only — enforced server-side by createUser itself, see
// ./actions.ts): the only form in the app with two fields, so it doesn't reuse the shared
// CreateNameForm (src/app/(app)/create-name-form.tsx), which is built around a single "name"
// input. The PIN input mirrors the sign-in PIN field (src/app/ingresar/pin-form.tsx): masked,
// numeric, exactly 4 characters, since an Admin may be typing it in front of others.
export function NewUserForm() {
  const [state, formAction, pending] = useActionState<CreateUserState, FormData>(createUser, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const nameId = useId();
  const pinId = useId();
  const errorId = useId();

  // Clears both fields after a successful create; an error leaves them as typed so the Admin can
  // see and fix what they entered (see src/app/(app)/create-name-form.tsx for the same pattern).
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 flex flex-col gap-2 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium">Nuevo usuario</h2>

      <label htmlFor={nameId} className="sr-only">
        Nombre
      </label>
      <input
        id={nameId}
        name="name"
        type="text"
        placeholder="Nombre"
        required
        aria-describedby={state?.error ? errorId : undefined}
        className="h-(--control-height) rounded-lg border bg-background px-3 text-base"
      />

      <label htmlFor={pinId} className="sr-only">
        PIN
      </label>
      <input
        id={pinId}
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        placeholder="PIN"
        required
        aria-describedby={state?.error ? errorId : undefined}
        className="h-(--control-height) rounded-lg border bg-background px-3 text-base tracking-[0.3em]"
      />

      {state?.error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-(--control-height) rounded-lg bg-primary px-4 text-base font-medium text-primary-foreground disabled:opacity-50"
      >
        Guardar
      </button>
    </form>
  );
}
