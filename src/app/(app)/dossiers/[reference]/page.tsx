import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, QrCode, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DossierStatusBadge } from "@/components/dossiers/dossier-status-badge";
import { MouvementTimeline } from "@/components/dossiers/mouvement-timeline";
import { CloseDossierButton } from "@/components/dossiers/close-dossier-button";
import { ReopenDossierButton } from "@/components/dossiers/reopen-dossier-button";
import {
  getDossierByReference,
  getDossierType,
  getMouvementsForDossier,
  getProfilesByIds,
  getServicesByIds,
} from "@/lib/data/dossiers";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { canAccessDossier } from "@/lib/dossiers/access";
import { formatDateTime } from "@/lib/date";
import { CacheDossierOnView } from "@/components/offline/cache-dossier-on-view";
import type { CachedDossierSnapshot, CachedMouvement } from "@/lib/offline/types";

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

  const [type, mouvements, profile] = await Promise.all([
    getDossierType(dossier.type_id),
    getMouvementsForDossier(dossier.id),
    getCurrentProfile(),
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

  const canScan = Boolean(
    profile && !dossier.is_locked && profile.role !== "auditeur" && canAccessDossier(profile, dossier),
  );
  const canClose = Boolean(
    profile &&
      !dossier.is_locked &&
      dossier.scan_count >= dossier.max_scans &&
      (profile.role === "admin" || (profile.role === "responsable_service" && canAccessDossier(profile, dossier))),
  );
  const canReopen = Boolean(profile && dossier.is_locked && profile.role === "admin");

  const cachedMouvements: CachedMouvement[] = mouvements.map((m) => ({
    ...m,
    actorName: m.performed_by ? (profileNameById.get(m.performed_by)?.full_name ?? null) : null,
    fromServiceName: m.from_service_id ? (serviceNameById.get(m.from_service_id)?.name ?? null) : null,
    toServiceName: m.to_service_id ? (serviceNameById.get(m.to_service_id)?.name ?? null) : null,
  }));
  const snapshot: CachedDossierSnapshot = {
    reference: dossier.reference,
    qrToken: dossier.qr_token,
    dossier,
    typeLabel: type?.label ?? "",
    currentServiceName: currentService?.name ?? null,
    mouvements: cachedMouvements,
    cachedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <CacheDossierOnView snapshot={snapshot} />
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

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dossiers/${dossier.reference}/etiquette`}>
              <QrCode className="size-4" aria-hidden />
              Étiquette QR
            </Link>
          </Button>
          {canScan ? (
            <Button asChild size="sm">
              <Link href={`/dossiers/${dossier.reference}/scan`}>
                <ScanLine className="size-4" aria-hidden />
                Scanner
              </Link>
            </Button>
          ) : null}
          {canClose ? <CloseDossierButton dossierId={dossier.id} /> : null}
          {canReopen ? <ReopenDossierButton dossierId={dossier.id} /> : null}
        </div>
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
