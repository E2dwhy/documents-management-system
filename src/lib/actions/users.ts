"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { userInviteSchema, userEditSchema } from "@/lib/validations/user-invite";
import { translateAuthError } from "@/lib/auth/errors";
import { appConfig } from "@/lib/config";
import type { UserFormState } from "@/lib/actions/users-state";

/**
 * inviteUserAction uses the service-role client (auth.admin.*), which
 * bypasses RLS entirely — this check is the *only* thing standing between
 * any authenticated user and creating arbitrary accounts, not a
 * belt-and-suspenders extra on top of an RLS policy the way it is for
 * updateUserAction/toggleUserActiveAction below (profiles already has an
 * admin-only RLS update policy; this mirrors it explicitly rather than
 * relying on a silent 0-rows-affected update).
 */
async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin";
}

export async function inviteUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  if (!(await requireAdmin())) {
    return { status: "error", message: "Action réservée aux administrateurs." };
  }

  const parsed = userInviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    serviceId: formData.get("serviceId"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const serviceClient = createServiceRoleClient();
  // Never used to log in — immediately followed by a password-reset email,
  // same as "mot de passe oublié". Just satisfies createUser's requirement.
  const temporaryPassword = `Tmp-${crypto.randomUUID()}`;

  const { error: createError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      service_id: parsed.data.serviceId || null,
    },
  });
  if (createError) {
    return { status: "error", message: translateAuthError(createError.message) };
  }

  const publicClient = await createClient();
  const { error: resetError } = await publicClient.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appConfig.appUrl}/auth/callback?next=/update-password`,
  });

  revalidatePath("/admin/utilisateurs");

  if (resetError) {
    // The account exists either way (createUser above succeeded) — this
    // only means the follow-up email failed to send (e.g. an
    // unroutable/typo'd domain). Still a "success" in that the account is
    // usable, but the admin needs to know the link never went out.
    return {
      status: "success",
      message: `Compte créé, mais l'envoi de l'email a échoué (${translateAuthError(resetError.message)}). Utilisez "Mot de passe oublié" avec une adresse valide, ou contactez l'utilisateur directement.`,
    };
  }

  return {
    status: "success",
    message: `Compte créé. Un lien de définition de mot de passe a été envoyé à ${parsed.data.email}.`,
  };
}

export async function updateUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  if (!(await requireAdmin())) {
    return { status: "error", message: "Action réservée aux administrateurs." };
  }

  const id = formData.get("id");
  if (typeof id !== "string") return { status: "error", message: "Utilisateur invalide." };

  const parsed = userEditSchema.safeParse({
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    serviceId: formData.get("serviceId"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      service_id: parsed.data.serviceId || null,
    })
    .eq("id", id);
  if (error) return { status: "error", message: "Une erreur est survenue." };

  revalidatePath("/admin/utilisateurs");
  return { status: "success" };
}

export async function toggleUserActiveAction(id: string, isActive: boolean): Promise<UserFormState> {
  if (!(await requireAdmin())) {
    return { status: "error", message: "Action réservée aux administrateurs." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", id);
  if (error) return { status: "error", message: "Une erreur est survenue." };

  revalidatePath("/admin/utilisateurs");
  return { status: "success" };
}
