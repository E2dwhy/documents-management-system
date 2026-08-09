"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFormAction } from "@/hooks/use-form-action";
import {
  createDossierTypeAction,
  updateDossierTypeAction,
  initialDossierTypeFormState,
} from "@/lib/actions/dossier-types";
import type { DossierTypeRow } from "@/components/admin/dossier-types-manager";

export function DossierTypeFormDialog({ type }: { type?: DossierTypeRow }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(type);
  const { state, isPending, submit } = useFormAction(
    isEdit ? updateDossierTypeAction : createDossierTypeAction,
    initialDossierTypeFormState,
    () => {
      setOpen(false);
      toast.success(isEdit ? "Type modifié." : "Type créé.");
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="size-7" aria-label="Modifier">
            <Pencil className="size-3.5" aria-hidden />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Ajouter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le type" : "Nouveau type de dossier"}</DialogTitle>
          <DialogDescription>Le circuit (nombre d&apos;étapes) s&apos;applique aux nouveaux dossiers.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          {isEdit ? <input type="hidden" name="id" value={type!.id} /> : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Clé (technique)</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={100}
                placeholder="demande_passeport"
                pattern="[a-z0-9_]+"
                defaultValue={type?.name}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="label">Libellé</Label>
              <Input id="label" name="label" required maxLength={150} defaultValue={type?.label} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxScans">Étapes du circuit</Label>
              <Input
                id="maxScans"
                name="maxScans"
                type="number"
                min={1}
                max={50}
                required
                defaultValue={type?.max_scans ?? 1}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lateThresholdHours">Retard après (heures)</Label>
              <Input
                id="lateThresholdHours"
                name="lateThresholdHours"
                type="number"
                min={1}
                max={8760}
                placeholder="Optionnel"
                defaultValue={type?.late_threshold_hours ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={type?.description ?? ""} />
          </div>

          {state.status === "error" && state.message ? (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
