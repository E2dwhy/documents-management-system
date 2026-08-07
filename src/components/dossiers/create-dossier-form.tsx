"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDossierAction, initialDossierFormState } from "@/lib/actions/dossiers";

interface DossierType {
  id: string;
  label: string;
  max_scans: number;
}

interface Service {
  id: string;
  name: string;
}

export function CreateDossierForm({ types, services }: { types: DossierType[]; services: Service[] }) {
  const [state, formAction, isPending] = useActionState(createDossierAction, initialDossierFormState);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");

  const selectedType = types.find((t) => t.id === selectedTypeId);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="title">Titre du dossier</Label>
        <Input id="title" name="title" required maxLength={200} placeholder="Ex. Demande de passeport" className="h-11" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ownerName">Propriétaire du dossier</Label>
        <Input id="ownerName" name="ownerName" maxLength={200} placeholder="Nom du demandeur" className="h-11" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="typeId">Type de dossier</Label>
        <Select name="typeId" value={selectedTypeId} onValueChange={setSelectedTypeId} required>
          <SelectTrigger id="typeId" className="h-11 w-full">
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedType ? (
          <p className="text-xs text-muted-foreground">
            Circuit de {selectedType.max_scans} étape{selectedType.max_scans > 1 ? "s" : ""}.
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="serviceId">Service initial</Label>
        <Select name="serviceId" required>
          <SelectTrigger id="serviceId" className="h-11 w-full">
            <SelectValue placeholder="Sélectionner un service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Créer le dossier et générer le QR
      </Button>
    </form>
  );
}
