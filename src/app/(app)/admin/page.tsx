import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Administration" };

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Administration</h1>
      <ComingSoon
        icon={Settings}
        title="Services, types de dossiers et utilisateurs"
        description="Gérer les services, les circuits de traitement et inviter des utilisateurs."
        phase="Phase 8"
      />
    </div>
  );
}
