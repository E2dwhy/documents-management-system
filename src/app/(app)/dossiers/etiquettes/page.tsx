import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDossiersByReferences, getDossierTypesByIds } from "@/lib/data/dossiers";
import { getAppSettings } from "@/lib/data/app-settings";
import { QrLabelSheet, type LabelData } from "@/components/dossiers/qr-label-sheet";

export const metadata: Metadata = { title: "Planche A4 — Étiquettes QR" };

function parseRefs(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value
    .split(",")
    .map((ref) => ref.trim())
    .filter(Boolean);
}

export default async function DossiersLabelSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ refs?: string | string[] }>;
}) {
  const { refs: rawRefs } = await searchParams;
  const references = parseRefs(rawRefs);

  const [dossiers, settings] = await Promise.all([
    getDossiersByReferences(references),
    getAppSettings(),
  ]);
  const typeLabelById = await getDossierTypesByIds(dossiers.map((d) => d.type_id));

  const labels: LabelData[] = dossiers.map((d) => ({
    reference: d.reference,
    qrToken: d.qr_token,
    title: d.title,
    typeLabel: typeLabelById.get(d.type_id)?.label ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 print:hidden">
        <Button asChild variant="ghost" size="icon" aria-label="Retour aux dossiers">
          <Link href="/dossiers">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Planche A4 — Étiquettes QR</h1>
          <p className="text-sm text-muted-foreground">
            {references.length === 0
              ? "Sélectionnez des dossiers depuis la liste pour générer une planche."
              : `${labels.length} sur ${references.length} dossier(s) sélectionné(s) — à imprimer sur papier ordinaire ou planche autocollante.`}
          </p>
        </div>
      </div>

      {references.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center print:hidden">
          <p className="text-sm text-muted-foreground">Aucune sélection reçue.</p>
          <Button asChild size="sm">
            <Link href="/dossiers">Aller à la liste des dossiers</Link>
          </Button>
        </div>
      ) : (
        <QrLabelSheet labels={labels} orgName={settings.orgName} />
      )}
    </div>
  );
}
