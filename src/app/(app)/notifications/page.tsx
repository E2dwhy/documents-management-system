import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Alertes" };

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Alertes</h1>
      <ComingSoon
        icon={Bell}
        title="Dossiers en retard"
        description="Notifications pour les dossiers qui dépassent le délai configuré pour leur type."
        phase="Phase 7"
      />
    </div>
  );
}
