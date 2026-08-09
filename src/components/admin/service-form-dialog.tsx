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
  createServiceAction,
  updateServiceAction,
  initialServiceFormState,
} from "@/lib/actions/services";
import type { Service } from "@/lib/data/reference-data";

export function ServiceFormDialog({ service }: { service?: Service & { description: string | null } }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(service);
  const { state, isPending, submit } = useFormAction(
    isEdit ? updateServiceAction : createServiceAction,
    initialServiceFormState,
    () => {
      setOpen(false);
      toast.success(isEdit ? "Service modifié." : "Service créé.");
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
          <DialogTitle>{isEdit ? "Modifier le service" : "Nouveau service"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations du service." : "Créez un nouveau service."}
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          {isEdit ? <input type="hidden" name="id" value={service!.id} /> : null}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required maxLength={100} defaultValue={service?.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={service?.description ?? ""} />
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
