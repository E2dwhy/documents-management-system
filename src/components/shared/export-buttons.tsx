"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPdf } from "@/lib/export/pdf";
import { exportToExcel } from "@/lib/export/excel";
import type { ExportColumn } from "@/lib/export/types";

/**
 * `fetchRows` (not a static `rows` array) because an export should cover
 * every row matching the current filters, not just the current page of an
 * already-paginated list — the caller re-queries without the page limit
 * when the user actually clicks export, rather than the list eagerly
 * fetching everything on every filter change.
 */
export function ExportButtons<T>({
  fetchRows,
  columns,
  title,
  filename,
}: {
  fetchRows: () => Promise<T[]>;
  columns: ExportColumn<T>[];
  title: string;
  filename: string;
}) {
  const [pending, setPending] = useState<"pdf" | "excel" | null>(null);

  async function handleExport(format: "pdf" | "excel") {
    setPending(format);
    try {
      const rows = await fetchRows();
      if (rows.length === 0) {
        toast.info("Aucune ligne à exporter avec ces filtres.");
        return;
      }
      if (format === "pdf") exportToPdf(rows, columns, { title, filename });
      else exportToExcel(rows, columns, { sheetName: title, filename });
    } catch {
      toast.error("Échec de l'export. Réessayez.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending !== null} onClick={() => void handleExport("pdf")}>
        {pending === "pdf" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileText className="size-4" aria-hidden />}
        PDF
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending !== null} onClick={() => void handleExport("excel")}>
        {pending === "excel" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <FileSpreadsheet className="size-4" aria-hidden />
        )}
        Excel
      </Button>
    </div>
  );
}
