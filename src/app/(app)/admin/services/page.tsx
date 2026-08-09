import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "@/components/admin/services-manager";

export const metadata: Metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("id, name, description, is_active").order("name");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Services</h1>
        <p className="text-sm text-muted-foreground">Bureaux/départements entre lesquels les dossiers circulent.</p>
      </div>
      <ServicesManager services={data ?? []} />
    </div>
  );
}
