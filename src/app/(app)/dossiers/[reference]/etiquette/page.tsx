import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDossierByReference, getDossierType } from "@/lib/data/dossiers";
import { QrLabel } from "@/components/dossiers/qr-label";
import { getAppSettings } from "@/lib/data/app-settings";

export const metadata: Metadata = { title: "Étiquette QR" };

export default async function DossierLabelPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const dossier = await getDossierByReference(reference);
  if (!dossier) notFound();

  const [type, settings] = await Promise.all([getDossierType(dossier.type_id), getAppSettings()]);

  return (
    <div className="space-y-6">
      <div className="space-y-1 print:hidden">
        <h1 className="text-xl font-semibold tracking-tight">Étiquette QR</h1>
        <p className="text-sm text-muted-foreground">
          À imprimer et coller sur le dossier physique.
        </p>
      </div>

      <QrLabel
        reference={dossier.reference}
        qrToken={dossier.qr_token}
        title={dossier.title}
        ownerName={dossier.owner_name}
        typeLabel={type?.label ?? ""}
        orgName={settings.orgName}
      />
    </div>
  );
}
