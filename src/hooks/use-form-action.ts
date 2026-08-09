"use client";

import { useState, useTransition } from "react";

interface ActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

/**
 * A form-with-a-server-action pattern that needs an onSuccess side effect
 * (close a dialog, redirect, reset a field) can't use useActionState +
 * useEffect for that — reacting to state changes with an effect means
 * calling setState synchronously inside it, which the project's lint
 * config (correctly) flags as an anti-pattern. This does the same job —
 * pending state, error surfaced in the form, one call to the server
 * action — without an effect: onSuccess runs directly in the transition
 * callback, right where the result is known.
 *
 * React 19 lets a form's `action` take any function, not just a
 * useActionState dispatcher — `submit` below is passed straight to
 * `<form action={submit}>`.
 */
export function useFormAction<State extends ActionState>(
  action: (prevState: State, formData: FormData) => Promise<State>,
  initialState: State,
  onSuccess?: (state: State) => void,
) {
  const [state, setState] = useState<State>(initialState);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await action(state, formData);
      setState(result);
      if (result.status === "success") onSuccess?.(result);
    });
  }

  return { state, isPending, submit };
}
