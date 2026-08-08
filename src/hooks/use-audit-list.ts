"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MouvementAction } from "@/types/database";
import type { MouvementRow } from "@/lib/data/dossiers";
import { periodStartIso, type PeriodFilter } from "@/lib/filters/period";

export const AUDIT_PAGE_SIZE = 25;
const EXPORT_ROW_CAP = 5000;

export interface AuditFilters {
  dossierReference: string;
  performedBy: string | "all";
  serviceId: string | "all";
  action: MouvementAction | "all";
  period: PeriodFilter;
  page: number;
}

export const defaultAuditFilters: AuditFilters = {
  dossierReference: "",
  performedBy: "all",
  serviceId: "all",
  action: "all",
  period: "all",
  page: 1,
};

export interface EnrichedMouvement extends MouvementRow {
  dossierReference: string;
  dossierTitle: string;
  actorName: string | null;
  fromServiceName: string | null;
  toServiceName: string | null;
}

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * mouvements has no `reference` column of its own — resolving a dossier
 * reference filter means looking up its id first. Returns `undefined` when
 * no filter is set (skip), or `null` when the reference doesn't match any
 * dossier (caller should short-circuit to an empty result rather than
 * running an unfiltered query).
 */
async function resolveDossierIdFilter(
  supabase: SupabaseClient,
  reference: string,
): Promise<string | null | undefined> {
  const term = reference.trim();
  if (!term) return undefined;
  const { data } = await supabase.from("dossiers").select("id").eq("reference", term).maybeSingle();
  return data?.id ?? null;
}

function buildMouvementsQuery(
  supabase: SupabaseClient,
  filters: Omit<AuditFilters, "page" | "dossierReference">,
  dossierId: string | undefined,
) {
  let query = supabase.from("mouvements").select("*", { count: "exact" });

  if (dossierId) query = query.eq("dossier_id", dossierId);
  if (filters.performedBy !== "all") query = query.eq("performed_by", filters.performedBy);
  if (filters.action !== "all") query = query.eq("action", filters.action);
  if (filters.serviceId !== "all") {
    query = query.or(`from_service_id.eq.${filters.serviceId},to_service_id.eq.${filters.serviceId}`);
  }

  const since = periodStartIso(filters.period);
  if (since) query = query.gte("performed_at", since);

  return query.order("performed_at", { ascending: false });
}

async function enrichMouvements(
  supabase: SupabaseClient,
  rows: MouvementRow[],
): Promise<EnrichedMouvement[]> {
  const dossierIds = [...new Set(rows.map((m) => m.dossier_id))];
  const profileIds = [...new Set(rows.map((m) => m.performed_by).filter((id): id is string => Boolean(id)))];
  const serviceIds = [
    ...new Set(
      [...rows.map((m) => m.from_service_id), ...rows.map((m) => m.to_service_id)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];

  const [{ data: dossiers }, { data: profiles }, { data: services }] = await Promise.all([
    dossierIds.length > 0
      ? supabase.from("dossiers").select("id, reference, title").in("id", dossierIds)
      : Promise.resolve({ data: [] as { id: string; reference: string; title: string }[] }),
    profileIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", profileIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    serviceIds.length > 0
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const dossierById = new Map((dossiers ?? []).map((d) => [d.id, d]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const serviceById = new Map((services ?? []).map((s) => [s.id, s]));

  return rows.map((m) => ({
    ...m,
    dossierReference: dossierById.get(m.dossier_id)?.reference ?? "—",
    dossierTitle: dossierById.get(m.dossier_id)?.title ?? "",
    actorName: m.performed_by ? (profileById.get(m.performed_by)?.full_name ?? null) : null,
    fromServiceName: m.from_service_id ? (serviceById.get(m.from_service_id)?.name ?? null) : null,
    toServiceName: m.to_service_id ? (serviceById.get(m.to_service_id)?.name ?? null) : null,
  }));
}

export function useAuditList(filters: AuditFilters) {
  return useQuery({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const supabase = createClient();
      const dossierId = await resolveDossierIdFilter(supabase, filters.dossierReference);
      if (dossierId === null) return { rows: [], count: 0 };

      const from = (filters.page - 1) * AUDIT_PAGE_SIZE;
      const to = from + AUDIT_PAGE_SIZE - 1;
      const { data, error, count } = await buildMouvementsQuery(supabase, filters, dossierId).range(from, to);
      if (error) throw error;

      const enriched = await enrichMouvements(supabase, data ?? []);
      return { rows: enriched, count: count ?? 0 };
    },
    placeholderData: (previous) => previous,
  });
}

export async function fetchAllAuditRowsForExport(
  filters: Omit<AuditFilters, "page">,
): Promise<EnrichedMouvement[]> {
  const supabase = createClient();
  const dossierId = await resolveDossierIdFilter(supabase, filters.dossierReference);
  if (dossierId === null) return [];

  const { data, error } = await buildMouvementsQuery(supabase, filters, dossierId).limit(EXPORT_ROW_CAP);
  if (error) throw error;
  return enrichMouvements(supabase, data ?? []);
}
