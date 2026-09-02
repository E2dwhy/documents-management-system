import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type DossierRow = Database["public"]["Tables"]["dossiers"]["Row"];
export type MouvementRow = Database["public"]["Tables"]["mouvements"]["Row"];

/**
 * Server-side reads for the dossier detail/label pages. Deliberately two
 * or three small queries instead of a PostgREST embedded select
 * (`select("*, dossier_types(...)")`) — our hand-authored Database type
 * (src/types/database.ts) doesn't declare FK relationship metadata, so
 * embedding wouldn't type-check cleanly. Batch-by-id (getProfilesByIds,
 * getServicesByIds) keeps this from becoming N+1 on the timeline.
 */

export async function getDossierByReference(reference: string): Promise<DossierRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("dossiers").select("*").eq("reference", reference).maybeSingle();
  return data ?? null;
}

export async function getDossierByQrToken(qrToken: string): Promise<DossierRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("dossiers").select("*").eq("qr_token", qrToken).maybeSingle();
  return data ?? null;
}

/**
 * Batch lookup for the printable QR label sheet (`/dossiers/etiquettes`) —
 * one query for the whole selection instead of N. RLS still applies per
 * row, so a reference the caller can't see is silently dropped rather than
 * erroring; the result is reordered to match `references` so the printed
 * sheet follows the order the user picked them in.
 */
export async function getDossiersByReferences(references: string[]): Promise<DossierRow[]> {
  if (references.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("dossiers").select("*").in("reference", references);
  if (!data) return [];

  const byReference = new Map(data.map((d) => [d.reference, d]));
  return references.map((ref) => byReference.get(ref)).filter((d): d is DossierRow => d !== undefined);
}

export async function getDossierTypesByIds(
  ids: (string | null | undefined)[],
): Promise<Map<string, { id: string; label: string }>> {
  const uniqueIds = [...new Set(ids)].filter((id): id is string => Boolean(id));
  if (uniqueIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("dossier_types").select("id, label").in("id", uniqueIds);
  return new Map((data ?? []).map((t) => [t.id, t]));
}

export async function getDossierType(typeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dossier_types")
    .select("id, name, label, max_scans")
    .eq("id", typeId)
    .maybeSingle();
  return data;
}

export async function getMouvementsForDossier(dossierId: string): Promise<MouvementRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mouvements")
    .select("*")
    .eq("dossier_id", dossierId)
    .order("performed_at", { ascending: false });
  return data ?? [];
}

export async function getProfilesByIds(
  ids: (string | null | undefined)[],
): Promise<Map<string, { id: string; full_name: string }>> {
  const uniqueIds = [...new Set(ids)].filter((id): id is string => Boolean(id));
  if (uniqueIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", uniqueIds);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

export async function getServicesByIds(
  ids: (string | null | undefined)[],
): Promise<Map<string, { id: string; name: string }>> {
  const uniqueIds = [...new Set(ids)].filter((id): id is string => Boolean(id));
  if (uniqueIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("services").select("id, name").in("id", uniqueIds);
  return new Map((data ?? []).map((s) => [s.id, s]));
}
