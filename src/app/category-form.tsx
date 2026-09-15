"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategory } from "./actions";

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Clears the input after a successful create; an error leaves it as typed so the User can fix it.
  useEffect(() => {
    if (state === undefined) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-8 flex flex-col gap-2 rounded-xl border bg-card p-4">
      <label htmlFor="new-category-name" className="text-sm font-medium">
        Nueva categoría
      </label>
      <div className="flex gap-2">
        <input
          id="new-category-name"
          name="name"
          type="text"
          required
          aria-describedby={state?.error ? "new-category-error" : undefined}
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-3 text-base"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
      {state?.error ? (
        <p id="new-category-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
