"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowRightLeft, CheckCircle2, Loader2, WifiOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DossierStatusBadge } from "@/components/dossiers/dossier-status-badge";
import { MouvementTimeline } from "@/components/dossiers/mouvement-timeline";
import { submitOrQueueScan, type SubmitOutcome } from "@/lib/offline/sync";
import { getScanBlockReason } from "@/lib/dossiers/access";
import { formatDateTime, formatRelative } from "@/lib/date";
import type { DossierRow } from "@/lib/data/dossiers";
import type { CachedMouvement } from "@/lib/offline/types";
import type { Service } from "@/lib/data/reference-data";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

type ScanActionChoice = "transfert" | "valide" | "rejete";

export function ScanConfirmation({
  dossier,
  typeLabel,
  currentServiceName,
  services,
  profile,
  mouvements,
  fromCache = false,
  cachedAt,
  onSubmitted,
}: {
  dossier: DossierRow;
  typeLabel: string;
  currentServiceName: string | null;
  services: Service[];
  profile: CurrentProfile;
  /** When present, rendered as a compact "recent history" section — mainly
   * useful when fromCache is true and there's no detail page to link to. */
  mouvements?: CachedMouvement[];
  fromCache?: boolean;
  cachedAt?: string;
  /** Called after a submit attempt (success, queued, or rejected) instead
   * of the default navigate-to-detail-page behavior — used by the /scanner
   * flow to reset to the next scan instead of leaving the page. */
  onSubmitted?: (outcome: SubmitOutcome) => void;
}) {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<ScanActionChoice>("transfert");
  const [targetServiceId, setTargetServiceId] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const blockReason = getScanBlockReason(profile, dossier);
  const availableTargets = services.filter((s) => s.id !== dossier.current_service_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await submitOrQueueScan({
      clientUuid: crypto.randomUUID(),
      dossierId: dossier.id,
      dossierReference: dossier.reference,
      dossierTitle: dossier.title,
      action: selectedAction === "transfert" ? "transfert" : "scan",
      toServiceId: selectedAction === "transfert" ? targetServiceId : null,
      newStatus: selectedAction === "transfert" ? null : selectedAction,
      note: note.trim() || null,
    });

    setIsSubmitting(false);

    if (result.outcome === "synced") {
      toast.success("Mouvement enregistré.");
    } else if (result.outcome === "queued") {
      toast.info("Hors ligne : le mouvement a été mis en file d'attente et sera synchronisé automatiquement.");
    } else {
      toast.error(result.message);
    }

    if (onSubmitted) {
      onSubmitted(result);
    } else if (result.outcome !== "rejected") {
      router.push(`/dossiers/${dossier.reference}`);
    }
  }

  if (blockReason) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <AlertTriangle className="size-8 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium">{dossier.reference}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{blockReason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fromCache ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <WifiOff className="size-3.5 shrink-0" aria-hidden />
          <span>
            Hors ligne — données mises en cache{cachedAt ? ` (${formatRelative(cachedAt)})` : ""}, peut-être
            périmées.
          </span>
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{dossier.reference}</p>
              <CardTitle className="truncate text-base">{dossier.title}</CardTitle>
              {dossier.owner_name ? <p className="text-sm text-muted-foreground">{dossier.owner_name}</p> : null}
            </div>
            <DossierStatusBadge status={dossier.status} className="shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Progress value={(dossier.scan_count / dossier.max_scans) * 100} className="h-1.5 flex-1" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {dossier.scan_count}/{dossier.max_scans}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {typeLabel} · {currentServiceName ?? "—"}
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Action</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={selectedAction === "transfert" ? "default" : "outline"}
              onClick={() => setSelectedAction("transfert")}
              className="h-14 flex-col gap-1 text-xs"
            >
              <ArrowRightLeft className="size-4" aria-hidden />
              Transférer
            </Button>
            <Button
              type="button"
              variant={selectedAction === "valide" ? "default" : "outline"}
              onClick={() => setSelectedAction("valide")}
              className="h-14 flex-col gap-1 text-xs"
            >
              <CheckCircle2 className="size-4" aria-hidden />
              Valider
            </Button>
            <Button
              type="button"
              variant={selectedAction === "rejete" ? "default" : "outline"}
              onClick={() => setSelectedAction("rejete")}
              className="h-14 flex-col gap-1 text-xs"
            >
              <XCircle className="size-4" aria-hidden />
              Rejeter
            </Button>
          </div>
        </div>

        {selectedAction === "transfert" ? (
          <div className="space-y-1.5">
            <Label htmlFor="targetService">Service de destination</Label>
            <Select value={targetServiceId} onValueChange={setTargetServiceId}>
              <SelectTrigger id="targetService" className="h-11 w-full">
                <SelectValue placeholder="Sélectionner un service" />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="note">Note (optionnel)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Commentaire sur ce mouvement…"
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full"
          disabled={isSubmitting || (selectedAction === "transfert" && !targetServiceId)}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Confirmer
        </Button>
      </form>

      {mouvements && mouvements.length > 0 ? (
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Historique récent
          </summary>
          <div className="mt-3">
            <MouvementTimeline
              mouvements={mouvements}
              profileNameById={new Map(mouvements.filter((m) => m.performed_by && m.actorName).map((m) => [m.performed_by!, { id: m.performed_by!, full_name: m.actorName! }]))}
              serviceNameById={
                new Map([
                  ...mouvements.filter((m) => m.from_service_id && m.fromServiceName).map((m) => [m.from_service_id!, { id: m.from_service_id!, name: m.fromServiceName! }] as const),
                  ...mouvements.filter((m) => m.to_service_id && m.toServiceName).map((m) => [m.to_service_id!, { id: m.to_service_id!, name: m.toServiceName! }] as const),
                ])
              }
            />
          </div>
        </details>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Dernière mise à jour connue : {formatDateTime(dossier.updated_at)}
      </p>
    </div>
  );
}
