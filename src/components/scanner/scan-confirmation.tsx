"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
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
import { registerScanAction, initialScanFormState } from "@/lib/actions/scan";
import type { DossierRow } from "@/lib/data/dossiers";
import type { Service } from "@/lib/data/reference-data";

type ScanAction = "transfert" | "valide" | "rejete";

export function ScanConfirmation({
  dossier,
  typeLabel,
  currentServiceName,
  services,
}: {
  dossier: DossierRow;
  typeLabel: string;
  currentServiceName: string | null;
  services: Service[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerScanAction, initialScanFormState);
  const [selectedAction, setSelectedAction] = useState<ScanAction>("transfert");
  const [targetServiceId, setTargetServiceId] = useState<string>("");
  const [clientUuid] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (state.status === "success" && state.reference) {
      toast.success("Mouvement enregistré.");
      router.push(`/dossiers/${state.reference}`);
    }
  }, [state, router]);

  const availableTargets = services.filter((s) => s.id !== dossier.current_service_id);

  return (
    <div className="space-y-6">
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

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="dossierId" value={dossier.id} />
        <input type="hidden" name="clientUuid" value={clientUuid} />
        <input type="hidden" name="action" value={selectedAction === "transfert" ? "transfert" : "scan"} />
        <input type="hidden" name="newStatus" value={selectedAction === "transfert" ? "" : selectedAction} />
        {selectedAction === "transfert" ? (
          <input type="hidden" name="toServiceId" value={targetServiceId} />
        ) : null}

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
          <Textarea id="note" name="note" rows={3} maxLength={2000} placeholder="Commentaire sur ce mouvement…" />
        </div>

        {state.status === "error" && state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full"
          disabled={isPending || (selectedAction === "transfert" && !targetServiceId)}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Confirmer
        </Button>
      </form>
    </div>
  );
}
