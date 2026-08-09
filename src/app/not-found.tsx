import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Next.js's default 404 is English-only ("This page could not be
 * found") — this replaces it app-wide. Reached for any unmatched route,
 * and also whenever a page calls notFound() (e.g. an unknown dossier
 * reference).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <FileQuestion className="size-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Page introuvable</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Cette page n&apos;existe pas ou le dossier recherché est introuvable.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </main>
  );
}
