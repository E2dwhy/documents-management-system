"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DossierStatus } from "@/types/database";

export const PAGE_SIZE = 20;

export type PeriodFilter = "all" | "7" | "30" | "90";

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

/** Strip PostgREST .or() syntax characters so free-text search can't break
 * the filter string (commas/parens are logic separators there). */
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,()%]/g, " ").trim();
}

function periodStartIso(period: PeriodFilter): string | null {
  if (period === "all") return null;
  const days = Number(period);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function useDossiersList(filters: DossiersFilters) {
  return useQuery({
    queryKey: ["dossiers", filters],
    queryFn: async () => {
      const supabase = createClient();
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

      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.order("created_at", { ascending: false }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
    placeholderData: (previous) => previous,
  });
}
