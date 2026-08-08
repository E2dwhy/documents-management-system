"use client";

import { AlertTriangle, Archive, FolderOpen, Lock, Loader2 } from "lucide-react";
import { StatTile } from "@/components/dashboard/stat-tile";
import { StatusBreakdownChart } from "@/components/dashboard/status-breakdown-chart";
import { ServiceBreakdownChart } from "@/components/dashboard/service-breakdown-chart";
import { ThroughputChart } from "@/components/dashboard/throughput-chart";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export function DashboardContent() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="py-8 text-center text-sm text-destructive">Impossible de charger les statistiques.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile icon={FolderOpen} label="Total dossiers" value={data.total} />
        <StatTile icon={FolderOpen} label="En cours" value={data.byStatus.en_cours} />
        <StatTile icon={Lock} label="Clôturés" value={data.byStatus.cloture} />
        <StatTile icon={Archive} label="Archivés" value={data.byStatus.archive} />
        <StatTile icon={AlertTriangle} label="En retard" value={data.late} tone="critical" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatusBreakdownChart byStatus={data.byStatus} />
        <ServiceBreakdownChart byService={data.byService} />
      </div>

      <ThroughputChart throughput={data.throughput} />
    </div>
  );
}
