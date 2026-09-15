"use client";

import { useActionState, useEffect, useId, useRef, type ReactNode } from "react";

export type CreateNameFormState = { error: string } | undefined;

type CreateNameAction<TState> = (prevState: TState, formData: FormData) => Promise<TState>;

// Shared shape for a single-name create/edit form (create Category, add a Product to a Category,
// rename either): the useActionState wiring, the reset-on-success effect, and the
// input/button/error markup. The server action, labels, styling, any extra hidden fields, and
// (for ProductForm's duplicate-create offer) extra state-driven content below the error, are the
// only things that differ between callers.
//
// `TState` defaults to the plain `{error} | undefined` shape every caller but ProductForm uses;
// ProductForm passes its own richer CreateProductState (which has outcomes beyond a single error)
// together with `getError` to extract the error message from it, and `renderExtra` to render its
// duplicate-create banner from the same state.
export function CreateNameForm<TState = CreateNameFormState>({
  action,
  label,
  labelVisible = false,
  placeholder,
  defaultValue,
  submitLabel = "Agregar",
  formClassName,
  buttonClassName,
  hiddenFields,
  getError = (state) => (state as unknown as CreateNameFormState)?.error,
  renderExtra,
}: {
  action: CreateNameAction<TState>;
  label: string;
  labelVisible?: boolean;
  placeholder?: string;
  // Prefills the name input, e.g. with the current name on an edit form; a create form leaves it
  // unset so the input starts empty.
  defaultValue?: string;
  submitLabel?: string;
  formClassName: string;
  buttonClassName: string;
  hiddenFields?: Record<string, string>;
  // Extracts the error message (if any) from the action's state. Defaults to the plain
  // `{error} | undefined` shape; a caller with a richer state (more outcomes than a single error)
  // passes its own.
  getError?: (state: TState) => string | undefined;
  // Extra content rendered inside the form, below the error, driven by the same state — e.g.
  // ProductForm's duplicate-create banner with its "Agregar a la lista de compras" offer. Most
  // callers don't need this.
  renderExtra?: (state: TState) => ReactNode;
}) {
  // useActionState's own type requires the action's previous-state parameter and the initial
  // state to both be `Awaited<TState>`, which TypeScript can't reduce to plain `TState` for an
  // unconstrained generic (even though none of our actions are ever Promise-typed themselves).
  // The `never` casts on the call are the narrow escape hatch for that mismatch; the result is
  // cast right back to the real, fully-typed shape this component works with.
  const [state, formAction, pending] = useActionState(action as never, undefined as never) as [
    TState,
    (formData: FormData) => void,
    boolean,
  ];
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const errorId = useId();

  // Clears the input after a successful create; an error (or other non-undefined outcome, e.g. a
  // duplicate) leaves it as typed so the User can see what they searched for.
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  const error = getError(state);

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
          defaultValue={defaultValue}
          required
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-3 text-base"
        />
        <button type="submit" disabled={pending} className={buttonClassName}>
          {submitLabel}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {renderExtra ? renderExtra(state) : null}
    </form>
  );
}
