import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Dossiers" };

export default function DossiersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Dossiers</h1>
      <ComingSoon
        icon={FolderOpen}
        title="Liste des dossiers"
        description="Création, recherche, filtres et détail des dossiers avec leur historique."
        phase="Phase 4"
      />
    </div>
  );
}
