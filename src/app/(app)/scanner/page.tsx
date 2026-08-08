import type { Metadata } from "next";
import { ScannerFlow } from "@/components/scanner/scanner-flow";
import { getActiveDossierTypes, getActiveServices } from "@/lib/data/reference-data";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export const metadata: Metadata = { title: "Scanner" };

export default async function ScannerPage() {
  const [services, types, profile] = await Promise.all([
    getActiveServices(),
    getActiveDossierTypes(),
    getCurrentProfile(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Scannez le QR d&apos;un dossier ou saisissez sa référence. Fonctionne hors ligne pour les
          dossiers déjà consultés.
        </p>
      </div>
      <ScannerFlow services={services} types={types} profile={profile} />
    </div>
  );
}
