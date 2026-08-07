import type { Metadata } from "next";
import { ScannerEntry } from "@/components/scanner/scanner-entry";

export const metadata: Metadata = { title: "Scanner" };

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Scannez le QR d&apos;un dossier ou saisissez sa référence.
        </p>
      </div>
      <ScannerEntry />
    </div>
  );
}
