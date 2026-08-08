import * as XLSX from "xlsx";
import type { ExportColumn } from "@/lib/export/types";

export function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  opts: { sheetName?: string; filename: string },
) {
  const data = rows.map((row) => {
    const record: Record<string, string> = {};
    for (const column of columns) {
      record[column.header] = column.accessor(row);
    }
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, (opts.sheetName ?? "Export").slice(0, 31)); // Excel sheet names cap at 31 chars

  XLSX.writeFile(workbook, opts.filename.endsWith(".xlsx") ? opts.filename : `${opts.filename}.xlsx`);
}
