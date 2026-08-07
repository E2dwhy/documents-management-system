"use client";

import { useState, useRef, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CameraOff, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { parseScanInput } from "@/lib/dossiers/parse-scan-input";

const QrCameraScanner = dynamic(
  () => import("@/components/scanner/qr-camera-scanner").then((m) => m.QrCameraScanner),
  { ssr: false },
);

/**
 * Scan entry point: camera on top, manual reference entry always visible
 * below it. The manual field isn't just a fallback for a missing camera —
 * a hardware barcode-scanner "gun" works by emulating a keyboard, so it
 * needs a focused text input to type into, same as a human typing a
 * reference by hand.
 */
export function ScannerEntry() {
  const router = useRouter();
  const [manualValue, setManualValue] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvingRef = useRef(false);

  async function resolveAndNavigate(raw: string) {
    if (resolvingRef.current) return; // camera can fire onScan repeatedly before we navigate away
    const parsed = parseScanInput(raw);
    if (parsed.kind === "unrecognized") {
      setError("Format non reconnu. Scannez une étiquette générée par l'application ou saisissez une référence (DOS-AAAA-NNNNN).");
      return;
    }

    resolvingRef.current = true;
    setResolving(true);
    setError(null);

    const supabase = createClient();
    const query =
      parsed.kind === "reference"
        ? supabase.from("dossiers").select("reference").eq("reference", parsed.value).maybeSingle()
        : supabase.from("dossiers").select("reference").eq("qr_token", parsed.value).maybeSingle();

    const { data, error: queryError } = await query;

    if (queryError || !data) {
      setError("Aucun dossier ne correspond à ce code ou cette référence.");
      setResolving(false);
      resolvingRef.current = false;
      return;
    }

    router.push(`/dossiers/${data.reference}/scan`);
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    void resolveAndNavigate(manualValue);
  }

  return (
    <div className="space-y-4">
      {cameraError ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <CameraOff className="size-6 text-muted-foreground" aria-hidden />
          <p className="max-w-xs text-sm text-muted-foreground">{cameraError}</p>
        </div>
      ) : (
        <QrCameraScanner
          onDecode={(value) => void resolveAndNavigate(value)}
          onError={(message) => setCameraError(message)}
        />
      )}

      <form onSubmit={handleManualSubmit} className="space-y-1.5">
        <Label htmlFor="manual-reference">Saisie manuelle ou scanner physique</Label>
        <div className="flex gap-2">
          <Input
            id="manual-reference"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder="DOS-2026-00123"
            autoComplete="off"
            className="h-11 flex-1"
            autoFocus={!!cameraError}
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={resolving || !manualValue}>
            {resolving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
