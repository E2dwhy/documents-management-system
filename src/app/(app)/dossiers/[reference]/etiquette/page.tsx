import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Étiquette QR</h1>
          <p className="text-sm text-muted-foreground">
            À imprimer et coller sur le dossier physique.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dossiers/etiquettes?refs=${encodeURIComponent(dossier.reference)}`}>
            <LayoutGrid className="size-4" aria-hidden />
            Planche A4 (plusieurs exemplaires)
          </Link>
        </Button>
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
