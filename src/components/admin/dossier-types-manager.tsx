"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DossierTypeFormDialog } from "@/components/admin/dossier-type-form-dialog";
import { toggleDossierTypeActiveAction, deleteDossierTypeAction } from "@/lib/actions/dossier-types";

export interface DossierTypeRow {
  id: string;
  name: string;
  label: string;
  max_scans: number;
  late_threshold_hours: number | null;
  description: string | null;
  is_active: boolean;
}

export function DossierTypesManager({ types }: { types: DossierTypeRow[] }) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  async function handleToggle(id: string, next: boolean) {
    setTogglingId(id);
    const result = await toggleDossierTypeActiveAction(id, next);
    if (result.status === "error") toast.error(result.message);
    setTogglingId(null);
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      const result = await deleteDossierTypeAction(id);
      if (result.status === "error") toast.error(result.message);
      else toast.success("Type supprimé.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{types.length} type{types.length > 1 ? "s" : ""}</p>
        <DossierTypeFormDialog />
      </div>

      <ul className="space-y-2">
        {types.map((type) => (
          <li key={type.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{type.label}</p>
                {!type.is_active ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Inactif
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {type.max_scans} étape{type.max_scans > 1 ? "s" : ""}
                {type.late_threshold_hours ? ` · retard après ${type.late_threshold_hours}h` : ""}
              </p>
            </div>

            {togglingId === type.id ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <Switch
                checked={type.is_active}
                onCheckedChange={(checked) => void handleToggle(type.id, checked)}
                aria-label={type.is_active ? "Désactiver" : "Activer"}
              />
            )}

            <DossierTypeFormDialog type={type} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" aria-label="Supprimer">
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer « {type.label} » ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Impossible si des dossiers y font encore référence — désactivez-le dans ce cas plutôt que de le
                    supprimer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => handleDelete(type.id)}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        ))}
      </ul>

      {types.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucun type de dossier pour le moment.</p>
      ) : null}
    </div>
  );
}
