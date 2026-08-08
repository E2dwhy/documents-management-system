import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { appConfig } from "@/lib/config";
import { formatDateTime } from "@/lib/date";
import type { ExportColumn } from "@/lib/export/types";

export function exportToPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  opts: { title: string; filename: string },
) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(opts.title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${appConfig.orgName} — exporté le ${formatDateTime(new Date())} — ${rows.length} ligne(s)`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => c.accessor(row))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}
