"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { userInviteSchema, userEditSchema, setPasswordSchema } from "@/lib/validations/user-invite";
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
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const serviceClient = createServiceRoleClient();
  // An admin-chosen password (below) makes the account usable immediately,
  // without depending on the reset email ever arriving — see
  // adminSetPasswordAction for unblocking an account created before this
  // option existed. Without one, fall back to a random password nobody
  // knows; the reset email is then the *only* way in, same as before.
  const chosenPassword = parsed.data.password || undefined;
  const usingChosenPassword = Boolean(chosenPassword);
  const initialPassword = chosenPassword ?? `Tmp-${crypto.randomUUID()}`;

  const { error: createError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: initialPassword,
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

  if (usingChosenPassword) {
    // The account is usable right now regardless of the reset email — the
    // whole point of setting a password here. The email is still sent as a
    // courtesy (so the person can pick their own password later), but its
    // failure is no longer the difference between "usable" and "locked out".
    return {
      status: "success",
      message: `Compte créé et utilisable immédiatement avec le mot de passe fourni (${initialPassword}). Communiquez-le à ${parsed.data.fullName}.`,
    };
  }

  if (resetError) {
    // The account exists either way (createUser above succeeded) — this
    // only means the follow-up email failed to send (e.g. an
    // unroutable/typo'd domain). Without a chosen password, that leaves the
    // account genuinely locked out — say so plainly rather than "success".
    return {
      status: "error",
      message: `Compte créé, mais l'envoi de l'email a échoué (${translateAuthError(resetError.message)}) et aucun mot de passe initial n'a été défini — le compte est inaccessible. Utilisez "Définir un mot de passe" sur cet utilisateur pour le débloquer.`,
    };
  }

  return {
    status: "success",
    message: `Compte créé. Un lien de définition de mot de passe a été envoyé à ${parsed.data.email}.`,
  };
}

/**
 * Unblocks an account that can't sign in — whether created before the
 * optional password field above existed, or because its invite email never
 * arrived (see README/task notes: this was the exact failure mode for
 * accounts created to simulate a dossier's lifecycle). Sets the password
 * directly via the admin API; no email involved, no dependency on
 * deliverability.
 */
export async function adminSetPasswordAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  if (!(await requireAdmin())) {
    return { status: "error", message: "Action réservée aux administrateurs." };
  }

  const id = formData.get("id");
  if (typeof id !== "string") return { status: "error", message: "Utilisateur invalide." };

  const parsed = setPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient.auth.admin.updateUserById(id, { password: parsed.data.password });
  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  return {
    status: "success",
    message: `Mot de passe défini (${parsed.data.password}). Communiquez-le à l'utilisateur.`,
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
