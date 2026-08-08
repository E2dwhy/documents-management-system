import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CachedDossierSnapshot, CachedMouvement } from "@/lib/offline/types";
import { cacheDossierSnapshot } from "@/lib/offline/dossier-cache";

/**
 * Client-side equivalent of src/lib/data/dossiers.ts's server helpers —
 * deliberately separate rather than shared, since that module is built
 * around the server Supabase client (cookies()) and this one runs entirely
 * in the browser. Builds a fully self-contained snapshot (names already
 * resolved) and caches it, so a later offline lookup needs zero further
 * queries.
 */
export async function fetchAndCacheDossierSnapshot(
  client: SupabaseClient<Database>,
  by: { reference: string } | { qrToken: string },
): Promise<CachedDossierSnapshot | null> {
  const dossierQuery =
    "reference" in by
      ? client.from("dossiers").select("*").eq("reference", by.reference).maybeSingle()
      : client.from("dossiers").select("*").eq("qr_token", by.qrToken).maybeSingle();

  const { data: dossier, error: dossierError } = await dossierQuery;
  if (dossierError || !dossier) return null;

  const [{ data: type }, { data: mouvements }] = await Promise.all([
    client.from("dossier_types").select("label").eq("id", dossier.type_id).maybeSingle(),
    client
      .from("mouvements")
      .select("*")
      .eq("dossier_id", dossier.id)
      .order("performed_at", { ascending: false }),
  ]);

  const rows = mouvements ?? [];

  const serviceIds = [
    dossier.current_service_id,
    ...rows.map((m) => m.from_service_id),
    ...rows.map((m) => m.to_service_id),
  ].filter((id): id is string => Boolean(id));
  const profileIds = [dossier.created_by, dossier.closed_by, ...rows.map((m) => m.performed_by)].filter(
    (id): id is string => Boolean(id),
  );

  const [{ data: services }, { data: profiles }] = await Promise.all([
    serviceIds.length > 0
      ? client.from("services").select("id, name").in("id", [...new Set(serviceIds)])
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    profileIds.length > 0
      ? client.from("profiles").select("id, full_name").in("id", [...new Set(profileIds)])
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);

  const serviceNameById = new Map((services ?? []).map((s) => [s.id, s.name]));
  const profileNameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const cachedMouvements: CachedMouvement[] = rows.map((m) => ({
    ...m,
    actorName: m.performed_by ? (profileNameById.get(m.performed_by) ?? null) : null,
    fromServiceName: m.from_service_id ? (serviceNameById.get(m.from_service_id) ?? null) : null,
    toServiceName: m.to_service_id ? (serviceNameById.get(m.to_service_id) ?? null) : null,
  }));

  const snapshot: CachedDossierSnapshot = {
    reference: dossier.reference,
    qrToken: dossier.qr_token,
    dossier,
    typeLabel: type?.label ?? "",
    currentServiceName: dossier.current_service_id
      ? (serviceNameById.get(dossier.current_service_id) ?? null)
      : null,
    mouvements: cachedMouvements,
    cachedAt: new Date().toISOString(),
  };

  await cacheDossierSnapshot(snapshot);
  return snapshot;
}
