"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DossierStatusBadge } from "@/components/dossiers/dossier-status-badge";
import {
  PAGE_SIZE,
  useDossiersList,
  fetchAllDossiersForExport,
  type PeriodFilter,
} from "@/hooks/use-dossiers-list";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate, formatDateTime } from "@/lib/date";
import { STATUS_LABELS } from "@/lib/dossiers/status";
import { PERIOD_LABELS } from "@/lib/filters/period";
import { ExportButtons } from "@/components/shared/export-buttons";
import type { ExportColumn } from "@/lib/export/types";
import type { DossierStatus } from "@/types/database";
import type { DossierRow } from "@/lib/data/dossiers";
import type { DossierType, Service } from "@/lib/data/reference-data";

export function DossiersList({ types, services }: { types: DossierType[]; services: Service[] }) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState<DossierStatus | "all">("all");
  const [serviceId, setServiceId] = useState("all");
  const [typeId, setTypeId] = useState("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ search, status, serviceId, typeId, period, page }),
    [search, status, serviceId, typeId, period, page],
  );

  const { data, isLoading, isError } = useDossiersList(filters);

  const typeLabelById = useMemo(() => new Map(types.map((t) => [t.id, t.label])), [types]);
  const serviceNameById = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  const exportColumns: ExportColumn<DossierRow>[] = useMemo(
    () => [
      { header: "Référence", accessor: (d) => d.reference },
      { header: "Titre", accessor: (d) => d.title },
      { header: "Propriétaire", accessor: (d) => d.owner_name ?? "" },
      { header: "Type", accessor: (d) => typeLabelById.get(d.type_id) ?? "" },
      { header: "Statut", accessor: (d) => STATUS_LABELS[d.status] },
      { header: "Service actuel", accessor: (d) => (d.current_service_id ? (serviceNameById.get(d.current_service_id) ?? "") : "") },
      { header: "Progression", accessor: (d) => `${d.scan_count}/${d.max_scans}` },
      { header: "Créé le", accessor: (d) => formatDateTime(d.created_at) },
    ],
    [typeLabelById, serviceNameById],
  );

  const hasActiveFilters =
    status !== "all" || serviceId !== "all" || typeId !== "all" || period !== "all" || search !== "";

  function resetFilters() {
    setSearchInput("");
    setStatus("all");
    setServiceId("all");
    setTypeId("all");
    setPeriod("all");
    setPage(1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder="Référence, titre ou propriétaire…"
          className="h-11 pl-9"
          aria-label="Rechercher un dossier"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as DossierStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 flex-1 basis-[45%] text-xs">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={serviceId}
          onValueChange={(v) => {
            setServiceId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 flex-1 basis-[45%] text-xs">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeId}
          onValueChange={(v) => {
            setTypeId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 flex-1 basis-[45%] text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={period}
          onValueChange={(v) => {
            setPeriod(v as PeriodFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 flex-1 basis-[45%] text-xs">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs">
            <X className="size-3.5" aria-hidden />
            Réinitialiser
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">
          Impossible de charger les dossiers. Réessayez.
        </p>
      ) : data && data.rows.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{data.count} dossier{data.count > 1 ? "s" : ""}</p>
            <ExportButtons
              fetchRows={() => fetchAllDossiersForExport({ search, status, serviceId, typeId, period })}
              columns={exportColumns}
              title="Dossiers"
              filename="dossiers"
            />
          </div>
          <ul className="space-y-2">
            {data.rows.map((dossier) => (
              <li key={dossier.id}>
                <Link
                  href={`/dossiers/${dossier.reference}`}
                  className="flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-muted-foreground">{dossier.reference}</p>
                      <p className="truncate text-sm font-medium">{dossier.title}</p>
                    </div>
                    <DossierStatusBadge status={dossier.status} className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(dossier.scan_count / dossier.max_scans) * 100} className="h-1.5 flex-1" />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {dossier.scan_count}/{dossier.max_scans}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{typeLabelById.get(dossier.type_id) ?? "—"}</span>
                    <span>
                      {dossier.current_service_id
                        ? (serviceNameById.get(dossier.current_service_id) ?? "—")
                        : "—"}
                    </span>
                    <span>{formatDate(dossier.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {hasActiveFilters ? "Aucun dossier ne correspond à ces filtres." : "Aucun dossier pour le moment."}
        </p>
      )}
    </div>
  );
}
