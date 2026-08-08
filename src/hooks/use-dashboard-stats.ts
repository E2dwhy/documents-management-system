"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DossierStatus } from "@/types/database";

const DASHBOARD_KEY = ["dashboard-stats"];
const THROUGHPUT_DAYS = 30;

export interface ServiceBreakdown {
  serviceId: string;
  serviceName: string;
  count: number;
}

export interface ThroughputPoint {
  date: string; // yyyy-MM-dd
  created: number;
  closed: number;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<DossierStatus, number>;
  late: number;
  byService: ServiceBreakdown[];
  throughput: ThroughputPoint[];
}

function dayKey(iso: string): string {
  return iso.slice(0, 10); // ISO timestamps are already yyyy-MM-ddTHH:mm:ss...
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();

  const [{ data: dossiers }, { data: types }, { data: services }] = await Promise.all([
    supabase
      .from("dossiers")
      .select("status, current_service_id, type_id, is_locked, updated_at, created_at, closed_at"),
    supabase.from("dossier_types").select("id, late_threshold_hours"),
    supabase.from("services").select("id, name"),
  ]);

  const rows = dossiers ?? [];
  const lateThresholdByType = new Map((types ?? []).map((t) => [t.id, t.late_threshold_hours]));
  const serviceNameById = new Map((services ?? []).map((s) => [s.id, s.name]));

  const byStatus: Record<DossierStatus, number> = {
    en_cours: 0,
    valide: 0,
    rejete: 0,
    cloture: 0,
    archive: 0,
  };
  const serviceCounts = new Map<string, number>();
  let late = 0;
  const now = Date.now();

  for (const d of rows) {
    byStatus[d.status] += 1;

    if (d.current_service_id) {
      serviceCounts.set(d.current_service_id, (serviceCounts.get(d.current_service_id) ?? 0) + 1);
    }

    if (!d.is_locked && d.status !== "cloture" && d.status !== "archive") {
      const thresholdHours = lateThresholdByType.get(d.type_id);
      if (thresholdHours != null) {
        const ageMs = now - new Date(d.updated_at).getTime();
        if (ageMs > thresholdHours * 60 * 60 * 1000) late += 1;
      }
    }
  }

  const byService: ServiceBreakdown[] = [...serviceCounts.entries()]
    .map(([serviceId, count]) => ({ serviceId, serviceName: serviceNameById.get(serviceId) ?? "—", count }))
    .sort((a, b) => b.count - a.count);

  // Throughput: created vs closed per day over the last THROUGHPUT_DAYS.
  const since = new Date();
  since.setDate(since.getDate() - THROUGHPUT_DAYS);
  const buckets = new Map<string, { created: number; closed: number }>();
  for (let i = 0; i < THROUGHPUT_DAYS; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(dayKey(d.toISOString()), { created: 0, closed: 0 });
  }
  for (const d of rows) {
    const createdKey = dayKey(d.created_at);
    if (buckets.has(createdKey)) buckets.get(createdKey)!.created += 1;
    if (d.closed_at) {
      const closedKey = dayKey(d.closed_at);
      if (buckets.has(closedKey)) buckets.get(closedKey)!.closed += 1;
    }
  }
  const throughput: ThroughputPoint[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return {
    total: rows.length,
    byStatus,
    late,
    byService,
    throughput,
  };
}

export function useDashboardStats() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    // Live updates: any dossier change (scan, transfer, closure, creation)
    // invalidates the aggregate query rather than trying to patch the
    // running totals in place — the aggregation is cheap enough to just
    // re-fetch, and it guarantees the numbers can never drift out of sync.
    const channel = supabase
      .channel("dashboard-dossiers")
      .on("postgres_changes", { event: "*", schema: "public", table: "dossiers" }, () => {
        void queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: fetchDashboardStats,
  });
}
