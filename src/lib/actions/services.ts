"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceSchema } from "@/lib/validations/service";
import type { ServiceFormState } from "@/lib/actions/services-state";

/** Postgres foreign_key_violation — thrown when deleting a service/type
 * still referenced by at least one dossier. Not an app bug, just means
 * "retire it instead" (is_active toggle), so it gets its own message
 * rather than the generic fallback. */
function translateWriteError(error: { code?: string; message: string } | null): string {
  if (!error) return "Une erreur est survenue. Veuillez réessayer.";
  if (error.code === "23503") {
    return "Impossible de supprimer : des dossiers y font encore référence. Désactivez-le plutôt.";
  }
  if (error.code === "23505") {
    return "Ce nom est déjà utilisé.";
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}

export async function createServiceAction(
  _prevState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/services");
  return { status: "success" };
}

export async function updateServiceAction(
  _prevState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const id = formData.get("id");
  if (typeof id !== "string") return { status: "error", message: "Service invalide." };

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ name: parsed.data.name, description: parsed.data.description || null })
    .eq("id", id);
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/services");
  return { status: "success" };
}

export async function toggleServiceActiveAction(id: string, isActive: boolean): Promise<ServiceFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id);
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/services");
  return { status: "success" };
}

export async function deleteServiceAction(id: string): Promise<ServiceFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/services");
  return { status: "success" };
}
