"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportButtons } from "@/components/shared/export-buttons";
import {
  AUDIT_PAGE_SIZE,
  useAuditList,
  fetchAllAuditRowsForExport,
  type AuditFilters,
  type EnrichedMouvement,
} from "@/hooks/use-audit-list";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDateTime } from "@/lib/date";
import { MOUVEMENT_ACTION_LABELS } from "@/lib/dossiers/status";
import { PERIOD_LABELS, type PeriodFilter } from "@/lib/filters/period";
import type { ExportColumn } from "@/lib/export/types";
import type { MouvementAction } from "@/types/database";
import type { Service, ProfileOption } from "@/lib/data/reference-data";

const exportColumns: ExportColumn<EnrichedMouvement>[] = [
  { header: "Date", accessor: (m) => formatDateTime(m.performed_at) },
  { header: "Dossier", accessor: (m) => m.dossierReference },
  { header: "Action", accessor: (m) => MOUVEMENT_ACTION_LABELS[m.action] },
  { header: "De", accessor: (m) => m.fromServiceName ?? "" },
  { header: "Vers", accessor: (m) => m.toServiceName ?? "" },
  { header: "Utilisateur", accessor: (m) => m.actorName ?? "Système" },
  { header: "Note", accessor: (m) => m.note ?? "" },
];

export function AuditList({ services, profiles }: { services: Service[]; profiles: ProfileOption[] }) {
  const [referenceInput, setReferenceInput] = useState("");
  const dossierReference = useDebouncedValue(referenceInput, 300);
  const [performedBy, setPerformedBy] = useState("all");
  const [serviceId, setServiceId] = useState("all");
  const [action, setAction] = useState<MouvementAction | "all">("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [page, setPage] = useState(1);

  const filters: AuditFilters = useMemo(
    () => ({ dossierReference, performedBy, serviceId, action, period, page }),
    [dossierReference, performedBy, serviceId, action, period, page],
  );

  const { data, isLoading, isError } = useAuditList(filters);

  const hasActiveFilters =
    performedBy !== "all" || serviceId !== "all" || action !== "all" || period !== "all" || dossierReference !== "";

  function resetFilters() {
    setReferenceInput("");
    setPerformedBy("all");
    setServiceId("all");
    setAction("all");
    setPeriod("all");
    setPage(1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / AUDIT_PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="audit-reference">Numéro de dossier</Label>
        <Input
          id="audit-reference"
          value={referenceInput}
          onChange={(e) => {
            setReferenceInput(e.target.value);
            setPage(1);
          }}
          placeholder="DOS-2026-00123"
          className="h-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={performedBy}
          onValueChange={(v) => {
            setPerformedBy(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 flex-1 basis-[45%] text-xs">
            <SelectValue placeholder="Utilisateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les utilisateurs</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name}
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
          value={action}
          onValueChange={(v) => {
            setAction(v as MouvementAction | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 flex-1 basis-[45%] text-xs">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {Object.entries(MOUVEMENT_ACTION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">Impossible de charger l&apos;historique.</p>
      ) : data && data.rows.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {data.count} mouvement{data.count > 1 ? "s" : ""}
            </p>
            <ExportButtons
              fetchRows={() =>
                fetchAllAuditRowsForExport({ dossierReference, performedBy, serviceId, action, period })
              }
              columns={exportColumns}
              title="Audit"
              filename="audit"
            />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Dossier</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="whitespace-nowrap">Service</TableHead>
                  <TableHead className="whitespace-nowrap">Utilisateur</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(m.performed_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Link href={`/dossiers/${m.dossierReference}`} className="text-xs font-medium underline underline-offset-2">
                        {m.dossierReference}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{MOUVEMENT_ACTION_LABELS[m.action]}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {m.fromServiceName && m.toServiceName
                        ? `${m.fromServiceName} → ${m.toServiceName}`
                        : (m.toServiceName ?? m.fromServiceName ?? "—")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{m.actorName ?? "Système"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {m.note ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
          {hasActiveFilters ? "Aucun mouvement ne correspond à ces filtres." : "Aucun mouvement enregistré."}
        </p>
      )}
    </div>
  );
}
