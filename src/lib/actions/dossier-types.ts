"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dossierTypeSchema } from "@/lib/validations/dossier-type";

export type DossierTypeFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialDossierTypeFormState: DossierTypeFormState = { status: "idle" };

function translateWriteError(error: { code?: string; message: string } | null): string {
  if (!error) return "Une erreur est survenue. Veuillez réessayer.";
  if (error.code === "23503") {
    return "Impossible de supprimer : des dossiers y font encore référence. Désactivez-le plutôt.";
  }
  if (error.code === "23505") {
    return "Cette clé est déjà utilisée.";
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}

function parseForm(formData: FormData) {
  return dossierTypeSchema.safeParse({
    name: formData.get("name"),
    label: formData.get("label"),
    maxScans: formData.get("maxScans"),
    lateThresholdHours: formData.get("lateThresholdHours"),
    description: formData.get("description"),
  });
}

export async function createDossierTypeAction(
  _prevState: DossierTypeFormState,
  formData: FormData,
): Promise<DossierTypeFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dossier_types").insert({
    name: parsed.data.name,
    label: parsed.data.label,
    max_scans: parsed.data.maxScans,
    late_threshold_hours: parsed.data.lateThresholdHours || null,
    description: parsed.data.description || null,
  });
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/types");
  return { status: "success" };
}

export async function updateDossierTypeAction(
  _prevState: DossierTypeFormState,
  formData: FormData,
): Promise<DossierTypeFormState> {
  const id = formData.get("id");
  if (typeof id !== "string") return { status: "error", message: "Type invalide." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("dossier_types")
    .update({
      name: parsed.data.name,
      label: parsed.data.label,
      max_scans: parsed.data.maxScans,
      late_threshold_hours: parsed.data.lateThresholdHours || null,
      description: parsed.data.description || null,
    })
    .eq("id", id);
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/types");
  return { status: "success" };
}

export async function toggleDossierTypeActiveAction(id: string, isActive: boolean): Promise<DossierTypeFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("dossier_types").update({ is_active: isActive }).eq("id", id);
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/types");
  return { status: "success" };
}

export async function deleteDossierTypeAction(id: string): Promise<DossierTypeFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("dossier_types").delete().eq("id", id);
  if (error) return { status: "error", message: translateWriteError(error) };

  revalidatePath("/admin/types");
  return { status: "success" };
}
