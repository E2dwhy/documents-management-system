import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DossierStatusBadge } from "@/components/dossiers/dossier-status-badge";
import { MouvementTimeline } from "@/components/dossiers/mouvement-timeline";
import {
  getDossierByReference,
  getDossierType,
  getMouvementsForDossier,
  getProfilesByIds,
  getServicesByIds,
} from "@/lib/data/dossiers";
import { formatDateTime } from "@/lib/date";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: reference };
}

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const dossier = await getDossierByReference(reference);
  if (!dossier) notFound();

  const [type, mouvements] = await Promise.all([
    getDossierType(dossier.type_id),
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

  const currentService = dossier.current_service_id ? serviceNameById.get(dossier.current_service_id) : undefined;
  const createdBy = dossier.created_by ? profileNameById.get(dossier.created_by) : undefined;
  const closedBy = dossier.closed_by ? profileNameById.get(dossier.closed_by) : undefined;
  const progressPct = (dossier.scan_count / dossier.max_scans) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">{dossier.reference}</p>
            <h1 className="truncate text-xl font-semibold tracking-tight">{dossier.title}</h1>
            {dossier.owner_name ? <p className="text-sm text-muted-foreground">{dossier.owner_name}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DossierStatusBadge status={dossier.status} />
            {dossier.is_locked ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="size-3" aria-hidden />
                Verrouillé
              </span>
            ) : null}
          </div>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href={`/dossiers/${dossier.reference}/etiquette`}>
            <QrCode className="size-4" aria-hidden />
            Étiquette QR
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Progress value={progressPct} className="h-2 flex-1" />
            <span className="shrink-0 text-sm font-medium">
              {dossier.scan_count} / {dossier.max_scans}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {dossier.scan_count >= dossier.max_scans
              ? "Dernière étape atteinte."
              : `Étape ${dossier.scan_count + 1} sur ${dossier.max_scans}.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="text-right">{type?.label ?? "—"}</dd>

            <dt className="text-muted-foreground">Service actuel</dt>
            <dd className="text-right">{currentService?.name ?? "—"}</dd>

            <dt className="text-muted-foreground">Créé par</dt>
            <dd className="text-right">{createdBy?.full_name ?? "—"}</dd>

            <dt className="text-muted-foreground">Créé le</dt>
            <dd className="text-right">{formatDateTime(dossier.created_at)}</dd>

            {dossier.closed_at ? (
              <>
                <dt className="text-muted-foreground">Clôturé par</dt>
                <dd className="text-right">{closedBy?.full_name ?? "—"}</dd>

                <dt className="text-muted-foreground">Clôturé le</dt>
                <dd className="text-right">{formatDateTime(dossier.closed_at)}</dd>
              </>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Historique</h2>
        <Separator className="mb-4" />
        <MouvementTimeline
          mouvements={mouvements}
          profileNameById={profileNameById}
          serviceNameById={serviceNameById}
        />
      </div>
    </div>
  );
}
