"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { SettingsFormState } from "@/lib/actions/settings-state";

const orgNameSchema = z.string().trim().min(1, "Le nom est requis").max(150, "150 caractères maximum");

export async function updateOrgNameAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = orgNameSchema.safeParse(formData.get("orgName"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS (app_settings_admin_update) is the real enforcement here — this
  // just lets a non-admin see a clear message instead of a silent no-op
  // (an UPDATE blocked by RLS affects 0 rows without necessarily erroring).
  const { error, data } = await supabase
    .from("app_settings")
    .update({ org_name: parsed.data, updated_by: user?.id })
    .eq("id", true)
    .select()
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "Action réservée aux administrateurs." };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}

/** Called after the browser client uploads the logo file directly to
 * Storage (see logo-uploader.tsx) — this just persists the resulting
 * public URL. The upload itself goes straight from the browser to
 * Storage rather than through a Server Action: Storage RLS already scopes
 * writes to admin (see the org-assets policies), so routing the file
 * through our server first would only double the upload bandwidth for no
 * security benefit. */
export async function updateLogoUrlAction(logoUrl: string | null): Promise<SettingsFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error, data } = await supabase
    .from("app_settings")
    .update({ logo_url: logoUrl, updated_by: user?.id })
    .eq("id", true)
    .select()
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "Action réservée aux administrateurs." };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
