"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { DossierStatus } from "@/types/database";
import { periodStartIso, sanitizeSearchTerm, type PeriodFilter } from "@/lib/filters/period";

export const PAGE_SIZE = 20;
/** Safety cap on unpaginated exports — plenty for any realistic filtered
 * list, protects against an accidental "export everything" on a huge table. */
const EXPORT_ROW_CAP = 5000;

export type { PeriodFilter };

export interface DossiersFilters {
  search: string;
  status: DossierStatus | "all";
  serviceId: string | "all";
  typeId: string | "all";
  period: PeriodFilter;
  page: number;
}

export const defaultDossiersFilters: DossiersFilters = {
  search: "",
  status: "all",
  serviceId: "all",
  typeId: "all",
  period: "all",
  page: 1,
};

type SupabaseClient = ReturnType<typeof createClient>;

/** Shared between the paginated list query and the unpaginated export
 * fetch, so the two can never drift into showing/exporting different rows
 * for what looks like the same filter selection. */
function buildDossiersQuery(supabase: SupabaseClient, filters: Omit<DossiersFilters, "page">) {
  let query = supabase.from("dossiers").select("*", { count: "exact" });

  const term = sanitizeSearchTerm(filters.search);
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(`reference.ilike.${pattern},title.ilike.${pattern},owner_name.ilike.${pattern}`);
  }
  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.serviceId !== "all") query = query.eq("current_service_id", filters.serviceId);
  if (filters.typeId !== "all") query = query.eq("type_id", filters.typeId);

  const since = periodStartIso(filters.period);
  if (since) query = query.gte("created_at", since);

  return query.order("created_at", { ascending: false });
}

export function useDossiersList(filters: DossiersFilters) {
  return useQuery({
    queryKey: ["dossiers", filters],
    queryFn: async () => {
      const supabase = createClient();
      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await buildDossiersQuery(supabase, filters).range(from, to);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
    placeholderData: (previous) => previous,
  });
}

export async function fetchAllDossiersForExport(
  filters: Omit<DossiersFilters, "page">,
): Promise<Database["public"]["Tables"]["dossiers"]["Row"][]> {
  const supabase = createClient();
  const { data, error } = await buildDossiersQuery(supabase, filters).limit(EXPORT_ROW_CAP);
  if (error) throw error;
  return data ?? [];
}
