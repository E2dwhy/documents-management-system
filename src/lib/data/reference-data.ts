import { createClient } from "@/lib/supabase/server";

/**
 * Small, mostly-static reference tables (services, dossier types) used to
 * populate dropdowns and to resolve ids -> display names without an N+1
 * query per row in lists — callers fetch these once and build a lookup map.
 */

export async function getActiveServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getActiveDossierTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dossier_types")
    .select("id, name, label, max_scans")
    .eq("is_active", true)
    .order("label");
  return data ?? [];
}
