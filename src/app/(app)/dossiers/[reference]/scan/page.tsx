import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getDossierByReference, getDossierType, getServicesByIds } from "@/lib/data/dossiers";
import { getActiveServices } from "@/lib/data/reference-data";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getScanBlockReason } from "@/lib/dossiers/access";
import { ScanConfirmation } from "@/components/scanner/scan-confirmation";

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

  const [type, services, currentServiceMap] = await Promise.all([
    getDossierType(dossier.type_id),
    getActiveServices(),
    getServicesByIds([dossier.current_service_id]),
  ]);

  const blockReason = getScanBlockReason(profile, dossier);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Scanner un dossier</h1>

      {blockReason ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <AlertTriangle className="size-8 text-muted-foreground" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium">{dossier.reference}</p>
            <p className="max-w-xs text-sm text-muted-foreground">{blockReason}</p>
          </div>
        </div>
      ) : (
        <ScanConfirmation
          dossier={dossier}
          typeLabel={type?.label ?? ""}
          currentServiceName={
            dossier.current_service_id ? (currentServiceMap.get(dossier.current_service_id)?.name ?? null) : null
          }
          services={services}
        />
      )}
    </div>
  );
}
