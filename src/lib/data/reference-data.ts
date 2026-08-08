import { createClient } from "@/lib/supabase/server";

/**
 * Small, mostly-static reference tables (services, dossier types) used to
 * populate dropdowns and to resolve ids -> display names without an N+1
 * query per row in lists — callers fetch these once and build a lookup map.
 */

export interface Service {
  id: string;
  name: string;
}

export interface DossierType {
  id: string;
  name: string;
  label: string;
  max_scans: number;
}

export interface ProfileOption {
  id: string;
  full_name: string;
}

export async function getActiveServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getActiveDossierTypes(): Promise<DossierType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dossier_types")
    .select("id, name, label, max_scans")
    .eq("is_active", true)
    .order("label");
  return data ?? [];
}

/** All profiles, including deactivated ones — the audit "user" filter
 * needs to find actions performed by someone no longer active. */
export async function getAllProfiles(): Promise<ProfileOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
  return data ?? [];
}
