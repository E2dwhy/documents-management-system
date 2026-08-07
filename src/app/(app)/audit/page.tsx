import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Audit" };

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Audit</h1>
      <ComingSoon
        icon={ClipboardList}
        title="Historique global et exports"
        description="Filtrer tous les mouvements par utilisateur, période, service ou dossier, et exporter en PDF/Excel."
        phase="Phase 7"
      />
    </div>
  );
}
