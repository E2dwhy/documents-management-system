import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getDossierByReference,
  getDossierType,
  getMouvementsForDossier,
  getProfilesByIds,
  getServicesByIds,
} from "@/lib/data/dossiers";
import { getActiveServices } from "@/lib/data/reference-data";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { ScanConfirmation } from "@/components/scanner/scan-confirmation";
import type { CachedMouvement } from "@/lib/offline/types";

export const metadata: Metadata = { title: "Scanner un dossier" };

export default async function DossierScanPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const dossier = await getDossierByReference(reference);
  if (!dossier) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [type, services, mouvements] = await Promise.all([
    getDossierType(dossier.type_id),
    getActiveServices(),
    getMouvementsForDossier(dossier.id),
  ]);

  const serviceIds = [
    dossier.current_service_id,
    ...mouvements.map((m) => m.from_service_id),
    ...mouvements.map((m) => m.to_service_id),
  ];
  const profileIds = [dossier.created_by, dossier.closed_by, ...mouvements.map((m) => m.performed_by)];
  const [serviceNameById, profileNameById] = await Promise.all([
    getServicesByIds(serviceIds),
    getProfilesByIds(profileIds),
  ]);

  const cachedMouvements: CachedMouvement[] = mouvements.map((m) => ({
    ...m,
    actorName: m.performed_by ? (profileNameById.get(m.performed_by)?.full_name ?? null) : null,
    fromServiceName: m.from_service_id ? (serviceNameById.get(m.from_service_id)?.name ?? null) : null,
    toServiceName: m.to_service_id ? (serviceNameById.get(m.to_service_id)?.name ?? null) : null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Scanner un dossier</h1>
      <ScanConfirmation
        dossier={dossier}
        typeLabel={type?.label ?? ""}
        currentServiceName={
          dossier.current_service_id ? (serviceNameById.get(dossier.current_service_id)?.name ?? null) : null
        }
        services={services}
        profile={profile}
        mouvements={cachedMouvements}
      />
    </div>
  );
}
