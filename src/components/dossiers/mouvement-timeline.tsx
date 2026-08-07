import {
  ArrowRightLeft,
  FilePlus,
  Lock,
  LockOpen,
  Pencil,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import { formatDateTime } from "@/lib/date";
import { MOUVEMENT_ACTION_LABELS } from "@/lib/dossiers/status";
import type { MouvementRow } from "@/lib/data/dossiers";
import type { MouvementAction } from "@/types/database";

const ACTION_ICONS: Record<MouvementAction, LucideIcon> = {
  creation: FilePlus,
  scan: ScanLine,
  transfert: ArrowRightLeft,
  modification: Pencil,
  cloture: Lock,
  reouverture: LockOpen,
};

export function MouvementTimeline({
  mouvements,
  profileNameById,
  serviceNameById,
}: {
  mouvements: MouvementRow[];
  profileNameById: Map<string, { id: string; full_name: string }>;
  serviceNameById: Map<string, { id: string; name: string }>;
}) {
  if (mouvements.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Aucun mouvement enregistré.</p>;
  }

  return (
    <ol className="space-y-4">
      {mouvements.map((mouvement) => {
        const Icon = ACTION_ICONS[mouvement.action];
        const actor = mouvement.performed_by ? profileNameById.get(mouvement.performed_by) : undefined;
        const fromService = mouvement.from_service_id ? serviceNameById.get(mouvement.from_service_id) : undefined;
        const toService = mouvement.to_service_id ? serviceNameById.get(mouvement.to_service_id) : undefined;

        return (
          <li key={mouvement.id} className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted">
              <Icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5 pb-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm font-medium">{MOUVEMENT_ACTION_LABELS[mouvement.action]}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(mouvement.performed_at)}</p>
              </div>
              {mouvement.action === "transfert" && fromService && toService ? (
                <p className="text-xs text-muted-foreground">
                  {fromService.name} → {toService.name}
                </p>
              ) : null}
              {mouvement.note ? <p className="text-sm text-muted-foreground">{mouvement.note}</p> : null}
              <p className="text-xs text-muted-foreground">
                {actor ? `Par ${actor.full_name}` : "Système"}
                {mouvement.step_number !== null ? ` · Étape ${mouvement.step_number}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
