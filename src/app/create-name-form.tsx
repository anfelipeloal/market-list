"use client";

import { useActionState, useEffect, useId, useRef } from "react";

export type CreateNameFormState = { error: string } | undefined;

type CreateNameAction = (prevState: CreateNameFormState, formData: FormData) => Promise<CreateNameFormState>;

// Shared shape for a single-name create form (create Category, add a Product to a Category):
// same useActionState wiring, the reset-on-success effect, and the input/button/error markup.
// Only the server action, labels, styling and any extra hidden fields differ between callers.
export function CreateNameForm({
  action,
  label,
  labelVisible = false,
  placeholder,
  submitLabel = "Agregar",
  formClassName,
  buttonClassName,
  hiddenFields,
}: {
  action: CreateNameAction;
  label: string;
  labelVisible?: boolean;
  placeholder?: string;
  submitLabel?: string;
  formClassName: string;
  buttonClassName: string;
  hiddenFields?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const errorId = useId();

  // Clears the input after a successful create; an error leaves it as typed so the User can fix it.
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={formClassName}>
      <label htmlFor={inputId} className={labelVisible ? "text-sm font-medium" : "sr-only"}>
        {label}
      </label>
      <div className="flex gap-2">
        {hiddenFields
          ? Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)
          : null}
        <input
          id={inputId}
          name="name"
          type="text"
          placeholder={placeholder}
          required
          aria-describedby={state?.error ? errorId : undefined}
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-3 text-base"
        />
        <button type="submit" disabled={pending} className={buttonClassName}>
          {submitLabel}
        </button>
      </div>
      {state?.error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
