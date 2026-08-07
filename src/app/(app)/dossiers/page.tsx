import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DossiersList } from "@/components/dossiers/dossiers-list";
import { getActiveDossierTypes, getActiveServices } from "@/lib/data/reference-data";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export const metadata: Metadata = { title: "Dossiers" };

export default async function DossiersPage() {
  const [types, services, profile] = await Promise.all([
    getActiveDossierTypes(),
    getActiveServices(),
    getCurrentProfile(),
  ]);

  const canCreate = profile?.role !== "auditeur";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Dossiers</h1>
        {canCreate ? (
          <Button asChild size="sm">
            <Link href="/dossiers/nouveau">
              <Plus className="size-4" aria-hidden />
              Nouveau
            </Link>
          </Button>
        ) : null}
      </div>

      <DossiersList types={types} services={services} />
    </div>
  );
}
