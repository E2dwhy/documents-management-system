import type { Metadata } from "next";
import { AuditList } from "@/components/audit/audit-list";
import { getActiveServices, getAllProfiles } from "@/lib/data/reference-data";

export const metadata: Metadata = { title: "Audit" };

export default async function AuditPage() {
  const [services, profiles] = await Promise.all([getActiveServices(), getAllProfiles()]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Audit</h1>
        <p className="text-sm text-muted-foreground">
          Historique complet des mouvements, tous dossiers confondus.
        </p>
      </div>
      <AuditList services={services} profiles={profiles} />
    </div>
  );
}
