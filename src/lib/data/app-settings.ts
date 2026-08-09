import { createClient } from "@/lib/supabase/server";
import { appConfig } from "@/lib/config";

export interface AppSettings {
  orgName: string;
  logoUrl: string | null;
}

/**
 * DB-backed org display settings (name/logo), editable by admin from
 * /admin/parametres without a redeploy. Falls back to the env-var default
 * (src/lib/config.ts) if the row is ever missing or the query fails —
 * this must never be the reason a page fails to render.
 */
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("org_name, logo_url").eq("id", true).maybeSingle();

  return {
    orgName: data?.org_name ?? appConfig.orgName,
    logoUrl: data?.logo_url ?? null,
  };
}
