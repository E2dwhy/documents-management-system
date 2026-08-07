import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Bonjour {profile?.full_name?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          {profile ? ROLE_LABELS[profile.role] : ""}
          {profile?.service_name ? ` · ${profile.service_name}` : ""}
        </p>
      </div>

      <ComingSoon
        icon={LayoutDashboard}
        title="Statistiques et vue d'ensemble"
        description="Dossiers en cours, clôturés, en retard, et activité récente."
        phase="Phase 7"
      />
    </div>
  );
}
