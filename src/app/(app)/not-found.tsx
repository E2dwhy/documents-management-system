import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Scoped to (app): reached when a page inside the authenticated shell
 * calls notFound() (an unknown dossier reference/QR token) — keeps the
 * header/bottom-nav visible instead of falling back to the bare root
 * not-found.tsx.
 */
export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <FileQuestion className="size-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Introuvable</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Cette page ou ce dossier n&apos;existe pas.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
