import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Scanner" };

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Scanner</h1>
      <ComingSoon
        icon={ScanLine}
        title="Scan QR et saisie manuelle"
        description="Scanner un dossier pour le transférer, le valider ou le rejeter — fonctionne aussi hors ligne."
        phase="Phase 5"
      />
    </div>
  );
}
