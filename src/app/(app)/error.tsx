"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Scoped to the (app) segment: the header/bottom-nav (rendered by
 * (app)/layout.tsx, a sibling this boundary doesn't replace) stay visible
 * around the error instead of the whole shell disappearing.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Impossible d&apos;afficher cette page. Vérifiez votre connexion et réessayez.
        </p>
      </div>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
