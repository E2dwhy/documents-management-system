"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { translateRpcError } from "@/lib/data/errors";
import { z } from "zod";

const registerScanSchema = z.object({
  dossierId: z.string().uuid(),
  action: z.enum(["scan", "transfert"]),
  clientUuid: z.string().uuid(),
  toServiceId: z.string().uuid().optional().or(z.literal("")),
  newStatus: z.enum(["en_cours", "valide", "rejete"]).optional().or(z.literal("")),
  note: z.string().max(2000).optional(),
});

export type ScanFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  reference?: string;
};

export const initialScanFormState: ScanFormState = { status: "idle" };

export async function registerScanAction(
  _prevState: ScanFormState,
  formData: FormData,
): Promise<ScanFormState> {
  const parsed = registerScanSchema.safeParse({
    dossierId: formData.get("dossierId"),
    action: formData.get("action"),
    clientUuid: formData.get("clientUuid"),
    toServiceId: formData.get("toServiceId") ?? "",
    newStatus: formData.get("newStatus") ?? "",
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_scan", {
    p_dossier_id: parsed.data.dossierId,
    p_action: parsed.data.action,
    p_client_uuid: parsed.data.clientUuid,
    p_to_service_id: parsed.data.toServiceId || null,
    p_new_status: parsed.data.newStatus || null,
    p_note: parsed.data.note || null,
  });

  if (error || !data) {
    return { status: "error", message: translateRpcError(error?.message) };
  }

  revalidatePath(`/dossiers/${data.reference}`);
  return { status: "success", reference: data.reference };
}
