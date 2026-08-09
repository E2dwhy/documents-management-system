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
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { toggleServiceActiveAction, deleteServiceAction } from "@/lib/actions/services";

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export function ServicesManager({ services }: { services: ServiceRow[] }) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  async function handleToggle(id: string, next: boolean) {
    setTogglingId(id);
    const result = await toggleServiceActiveAction(id, next);
    if (result.status === "error") toast.error(result.message);
    setTogglingId(null);
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      const result = await deleteServiceAction(id);
      if (result.status === "error") toast.error(result.message);
      else toast.success("Service supprimé.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{services.length} service{services.length > 1 ? "s" : ""}</p>
        <ServiceFormDialog />
      </div>

      <ul className="space-y-2">
        {services.map((service) => (
          <li key={service.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{service.name}</p>
                {!service.is_active ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Inactif
                  </Badge>
                ) : null}
              </div>
              {service.description ? (
                <p className="truncate text-xs text-muted-foreground">{service.description}</p>
              ) : null}
            </div>

            {togglingId === service.id ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <Switch
                checked={service.is_active}
                onCheckedChange={(checked) => void handleToggle(service.id, checked)}
                aria-label={service.is_active ? "Désactiver" : "Activer"}
              />
            )}

            <ServiceFormDialog service={service} />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" aria-label="Supprimer">
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer « {service.name} » ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Impossible si des dossiers y font encore référence — désactivez-le dans ce cas plutôt que de le
                    supprimer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={() => handleDelete(service.id)}
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        ))}
      </ul>

      {services.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucun service pour le moment.</p>
      ) : null}
    </div>
  );
}
