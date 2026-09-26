"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { Loader2, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { qrPayloadUrl } from "@/lib/dossiers/qr";

export interface LabelData {
  reference: string;
  qrToken: string;
  title: string;
  typeLabel: string;
}

const LABELS_PER_PAGE = 24;
const COPIES_OPTIONS = [1, 2, 4, 8, 12, LABELS_PER_PAGE];

/**
 * A4 sheet of QR labels — 3 columns x 8 rows (24/page), 63.5 x 33.9mm each.
 * That size matches common off-the-shelf sticker-sheet formats (Avery
 * L4731/Herma equivalents), so the same layout works either printed on
 * plain paper (with the cut-line toggle on) or directly onto a pre-cut
 * adhesive sheet (toggle off). Distinct from `QrLabel` (single dossier,
 * `[reference]/etiquette`), which stays untouched — this is a parallel,
 * bulk-print flow built for the same `qrPayloadUrl` the scanner expects.
 *
 * Each dossier is repeated `copies` times (default: a full page) so one
 * label can be cut out and stuck on each page of the physical document.
 */
export function QrLabelSheet({ labels, orgName }: { labels: LabelData[]; orgName: string }) {
  const [dataUrls, setDataUrls] = useState<Map<string, string>>(new Map());
  const [showCutLines, setShowCutLines] = useState(true);
  const [copies, setCopies] = useState(LABELS_PER_PAGE);
  const printedLabels = labels.flatMap((label) => Array.from({ length: copies }, () => label));

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      labels.map((label) =>
        QRCode.toDataURL(qrPayloadUrl(label.qrToken), { width: 240, margin: 1 }).then(
          (url) => [label.reference, url] as const,
        ),
      ),
    ).then((entries) => {
      if (!cancelled) setDataUrls(new Map(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels identity changes only when refs change
  }, [labels.map((l) => l.reference).join(",")]);

  const allReady = dataUrls.size === labels.length;

  async function downloadPdf() {
    if (!allReady) return;

    // A4 in mm, 3 x 8 grid — mirrors the on-screen/print CSS grid below.
    const pageW = 210;
    const pageH = 297;
    const margin = 8;
    const cols = 3;
    const rows = 8;
    const cellW = (pageW - margin * 2) / cols;
    const cellH = (pageH - margin * 2) / rows;
    const qrSize = 22;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    printedLabels.forEach((label, i) => {
      const perPage = cols * rows;
      const posInPage = i % perPage;
      if (i > 0 && posInPage === 0) doc.addPage();

      const col = posInPage % cols;
      const row = Math.floor(posInPage / cols);
      const x = margin + col * cellW;
      const y = margin + row * cellH;

      const dataUrl = dataUrls.get(label.reference);
      if (dataUrl) doc.addImage(dataUrl, "PNG", x + 2, y + (cellH - qrSize) / 2, qrSize, qrSize);

      const textX = x + qrSize + 5;
      doc.setFontSize(9);
      doc.text(label.reference, textX, y + cellH / 2 - 3);
      doc.setFontSize(7);
      doc.text(doc.splitTextToSize(label.title, cellW - qrSize - 8), textX, y + cellH / 2 + 2);
    });
    doc.save(
      labels.length === 1
        ? `planche-qr-${labels[0].reference}.pdf`
        : `planche-qr-${labels.length}-dossiers.pdf`,
    );
  }

  if (labels.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucun dossier sélectionné.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Label htmlFor="copies" className="text-sm font-normal">
            Exemplaires par dossier
          </Label>
          <Select value={String(copies)} onValueChange={(value) => setCopies(Number(value))}>
            <SelectTrigger id="copies" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COPIES_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === LABELS_PER_PAGE ? `Page complète (${n})` : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="cut-lines" checked={showCutLines} onCheckedChange={setShowCutLines} />
          <Label htmlFor="cut-lines" className="text-sm font-normal">
            Traits de découpe (à décocher pour une planche autocollante pré-découpée)
          </Label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} disabled={!allReady}>
            <Printer className="size-4" aria-hidden />
            Imprimer
          </Button>
          <Button variant="outline" onClick={downloadPdf} disabled={!allReady}>
            <FileText className="size-4" aria-hidden />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {!allReady ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground print:hidden">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Génération des QR codes…
        </div>
      ) : null}

      <div
        className="qr-sheet grid grid-cols-3 gap-0 bg-white text-black"
        style={{ visibility: allReady ? "visible" : "hidden" }}
      >
        {printedLabels.map((label, i) => {
          const dataUrl = dataUrls.get(label.reference);
          return (
            <div
              key={`${label.reference}-${i}`}
              className={`flex items-center gap-2 p-2 ${showCutLines ? "border border-dashed border-gray-300" : ""}`}
              style={{ height: "33.9mm" }}
            >
              {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL, no optimization needed
                <img src={dataUrl} alt={`QR ${label.reference}`} className="size-16 shrink-0" width={64} height={64} />
              ) : (
                <div className="size-16 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">{orgName}</p>
                <p className="truncate font-mono text-xs font-semibold">{label.reference}</p>
                <p className="truncate text-[10px]">{label.title}</p>
                <p className="truncate text-[9px] text-gray-500">{label.typeLabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          .qr-sheet { break-inside: auto; }
          .qr-sheet > div { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
