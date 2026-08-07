import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CurrentProfile = Database["public"]["Tables"]["profiles"]["Row"] & {
  service_name: string | null;
};

/**
 * Resolves the signed-in user's profile (role, service, active flag) for
 * use in Server Components — the (app) layout's route guard and the
 * role-aware navigation both depend on this. Returns null if there's no
 * session, or if the auth user has no matching profiles row (shouldn't
 * happen in normal operation — see handle_new_user() — but an account
 * created by hand in the Supabase dashboard could hit this).
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return null;

  let serviceName: string | null = null;
  if (profile.service_id) {
    const { data: service } = await supabase
      .from("services")
      .select("name")
      .eq("id", profile.service_id)
      .maybeSingle();
    serviceName = service?.name ?? null;
  }

  return { ...profile, service_name: serviceName };
}
