"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateRpcError } from "@/lib/data/errors";
import { createDossierSchema } from "@/lib/validations/dossier";

export type DossierFormState = {
  status: "idle" | "error";
  message?: string;
};

export const initialDossierFormState: DossierFormState = { status: "idle" };

export async function createDossierAction(
  _prevState: DossierFormState,
  formData: FormData,
): Promise<DossierFormState> {
  const parsed = createDossierSchema.safeParse({
    title: formData.get("title"),
    ownerName: formData.get("ownerName"),
    typeId: formData.get("typeId"),
    serviceId: formData.get("serviceId"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  // create_dossier returns a single `dossiers` row (not SETOF), so
  // PostgREST already responds with a plain object — no .single() needed.
  const { data, error } = await supabase.rpc("create_dossier", {
    p_title: parsed.data.title,
    p_type_id: parsed.data.typeId,
    p_service_id: parsed.data.serviceId,
    p_owner_name: parsed.data.ownerName || null,
  });

  if (error || !data) {
    return { status: "error", message: translateRpcError(error?.message) };
  }

  // Straight to the printable label — matches the brief: "on save,
  // generate reference + QR, show printable QR label".
  redirect(`/dossiers/${data.reference}/etiquette`);
}
