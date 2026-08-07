import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateDossierForm } from "@/components/dossiers/create-dossier-form";
import { getActiveDossierTypes, getActiveServices } from "@/lib/data/reference-data";

export const metadata: Metadata = { title: "Nouveau dossier" };

export default async function NewDossierPage() {
  const [types, services] = await Promise.all([getActiveDossierTypes(), getActiveServices()]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Nouveau dossier</h1>
        <p className="text-sm text-muted-foreground">
          La référence et le QR code sont générés automatiquement à la création.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du dossier</CardTitle>
          <CardDescription>Le type détermine le nombre d&apos;étapes du circuit.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDossierForm types={types} services={services} />
        </CardContent>
      </Card>
    </div>
  );
}
