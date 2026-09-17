"use client";

import { useCallback, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { changePin } from "@/app/(app)/usuarios/actions";
import { ADMIN_ONLY_MESSAGE } from "@/app/(app)/usuarios/messages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CHANGE_PIN_TOAST_ID = "change-pin";
const INVALID_PIN_MESSAGE = "El PIN debe tener 4 dígitos.";
const DUPLICATE_PIN_MESSAGE = "Ese PIN ya está en uso.";
const NOT_FOUND_MESSAGE = "No encontramos ese usuario.";
const SUCCESS_MESSAGE = "PIN actualizado.";
// Shown only when isSelf (ticket #14's decision): an Admin changing anyone ELSE's PIN stays on
// this screen with nothing more to warn about, since only the target User's Sessions end
// (CONTEXT.md's Change PIN) — never the acting Admin's own.
const SELF_WARNING = "Vas a cambiar tu propio PIN: se cerrará tu sesión y tendrás que ingresar con el PIN nuevo.";

// Cambiar PIN (ticket #14, Admin-only — enforced server-side by changePin itself, see
// ../../actions.ts): a controlled PIN input rather than the useActionState/FormData forms used by
// EditUserForm and NewUserForm, because changePin is a plain callable action
// (`changePin(userId, newPin)`), not a `(prevState, formData)` action — exactly like removeUser
// (see ../../user-row.tsx) — so the confirmation dialog below can gate the call itself instead of
// gating a form submission.
//
// When `isSelf` (the Admin is changing their own PIN), submitting first opens a confirmation
// dialog warning that their session is about to end (CONTEXT.md's Change PIN ends every Session
// immediately, including the acting Admin's own); confirming calls changePin, which redirects to
// /ingresar itself once the old session is gone. Changing someone else's PIN needs no such
// warning — only the target's Sessions end — so it submits directly.
export function ChangePinForm({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pinId = useId();
  const errorId = useId();

  const submit = useCallback(() => {
    startTransition(async () => {
      const result = await changePin(userId, pin);

      if (result.outcome === "ok") {
        setPin("");
        setError(undefined);
        // isSelf: changePin() already redirected to /ingresar once its Session was gone, so this
        // component never re-renders to show a toast — nothing more to do here.
        if (!isSelf) toast(SUCCESS_MESSAGE, { id: CHANGE_PIN_TOAST_ID });
        return;
      }
      if (result.outcome === "forbidden") {
        toast(ADMIN_ONLY_MESSAGE, { id: CHANGE_PIN_TOAST_ID });
        return;
      }
      if (result.outcome === "invalidPin") {
        setError(INVALID_PIN_MESSAGE);
        return;
      }
      if (result.outcome === "duplicatePin") {
        setError(DUPLICATE_PIN_MESSAGE);
        return;
      }
      setError(NOT_FOUND_MESSAGE);
    });
  }, [userId, pin, isSelf]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSelf) {
      setConfirmOpen(true);
      return;
    }
    submit();
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    submit();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-medium">Cambiar PIN</h2>

      <label htmlFor={pinId} className="sr-only">
        Nuevo PIN
      </label>
      <input
        id={pinId}
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        placeholder="Nuevo PIN"
        required
        value={pin}
        onChange={(event) => setPin(event.target.value)}
        aria-describedby={error ? errorId : undefined}
        className="rounded-lg border bg-background px-3 py-3 text-base tracking-[0.3em]"
      />

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-50"
      >
        Guardar
      </button>

      {isSelf ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cambiar tu PIN?</AlertDialogTitle>
              <AlertDialogDescription>{SELF_WARNING}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
                Cambiar PIN
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </form>
  );
}
