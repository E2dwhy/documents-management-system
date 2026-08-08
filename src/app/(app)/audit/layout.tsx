import { ShieldAlert } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * /audit is admin/auditeur-only. RLS already scopes what agent/
 * responsable_service can see on the mouvements table, but the global
 * cross-dossier audit view is meant for oversight roles specifically —
 * blocking it outright here (rather than letting RLS silently return a
 * partial result) avoids a confusing half-empty page for other roles.
 */
export default async function AuditLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin" && profile?.role !== "auditeur") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-base font-semibold">Accès refusé</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Cette section est réservée aux administrateurs et auditeurs.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
