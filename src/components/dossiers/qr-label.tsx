"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { Download, FileText, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { qrPayloadUrl } from "@/lib/dossiers/qr";

interface QrLabelProps {
  reference: string;
  qrToken: string;
  title: string;
  ownerName: string | null;
  typeLabel: string;
  orgName: string;
}

export function QrLabel({ reference, qrToken, title, ownerName, typeLabel, orgName }: QrLabelProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrPayloadUrl(qrToken), { width: 320, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  function downloadPng() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${reference}.png`;
    link.click();
  }

  function downloadPdf() {
    if (!dataUrl) return;
    // 80x50mm — a common label-printer size. The QR stays scannable at
    // this size (tested down to ~25mm square for a URL this short).
    const doc = new jsPDF({ unit: "mm", format: [80, 50] });
    doc.addImage(dataUrl, "PNG", 5, 5, 40, 40);
    doc.setFontSize(11);
    doc.text(reference, 48, 12);
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(title, 28), 48, 19);
    if (ownerName) {
      doc.setFontSize(7);
      doc.text(doc.splitTextToSize(ownerName, 28), 48, 34);
    }
    doc.save(`${reference}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-3 rounded-lg border p-6 text-center print:border-0 print:p-0">
        <p className="text-xs font-medium text-muted-foreground print:text-black">{orgName}</p>

        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, no optimization needed
          <img src={dataUrl} alt={`QR code du dossier ${reference}`} className="size-56" width={224} height={224} />
        ) : (
          <div className="flex size-56 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}

        <div className="space-y-0.5">
          <p className="font-mono text-lg font-semibold tracking-tight">{reference}</p>
          <p className="text-sm font-medium">{title}</p>
          {ownerName ? <p className="text-sm text-muted-foreground">{ownerName}</p> : null}
          <p className="text-xs text-muted-foreground">{typeLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()} disabled={!dataUrl}>
          <Printer className="size-4" aria-hidden />
          Imprimer
        </Button>
        <Button variant="outline" onClick={downloadPng} disabled={!dataUrl}>
          <Download className="size-4" aria-hidden />
          Télécharger PNG
        </Button>
        <Button variant="outline" onClick={downloadPdf} disabled={!dataUrl}>
          <FileText className="size-4" aria-hidden />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
}
