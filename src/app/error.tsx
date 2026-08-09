"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Next.js requires error boundaries to be Client Components. This is the
 * top-level catch-all (public pages: login, reset-password, etc.) — see
 * src/app/(app)/error.tsx for the authenticated-shell equivalent that
 * keeps the header/nav visible around the error.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Quelque chose s&apos;est mal passé. Réessayez, ou revenez plus tard si le problème persiste.
        </p>
      </div>
      <Button onClick={reset}>Réessayer</Button>
    </main>
  );
}
