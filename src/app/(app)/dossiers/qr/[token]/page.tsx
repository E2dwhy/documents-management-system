import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";
import { getDossierByQrToken } from "@/lib/data/dossiers";

export const metadata: Metadata = { title: "QR" };

/**
 * The URL printed on every QR label points here. Reached two ways:
 *  - our own in-app scanner (src/components/scanner/scanner-flow.tsx)
 *    resolves the decoded URL/token itself and never actually navigates
 *    here — this route exists for the other case:
 *  - a generic camera app opens the printed label's URL directly in a
 *    browser, landing on this exact route (guarded by src/proxy.ts like
 *    everything else — an unauthenticated visitor is sent to /login first,
 *    with this URL preserved as `next`)
 */
export default async function QrTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dossier = await getDossierByQrToken(token);

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <QrCode className="size-8 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-base font-semibold">QR code invalide</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Aucun dossier ne correspond à ce code. Vérifiez l&apos;étiquette ou contactez un administrateur.
          </p>
        </div>
      </div>
    );
  }

  redirect(`/dossiers/${dossier.reference}/scan`);
}
