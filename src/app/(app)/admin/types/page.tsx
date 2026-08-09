import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DossierTypesManager } from "@/components/admin/dossier-types-manager";

export const metadata: Metadata = { title: "Types de dossiers" };

export default async function AdminDossierTypesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dossier_types")
    .select("id, name, label, max_scans, late_threshold_hours, description, is_active")
    .order("label");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Types de dossiers</h1>
        <p className="text-sm text-muted-foreground">
          Chaque type définit son circuit (nombre d&apos;étapes) et, en option, un seuil de retard.
        </p>
      </div>
      <DossierTypesManager types={data ?? []} />
    </div>
  );
}
