"use client";

import { useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { CameraOff, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const QrCameraScanner = dynamic(
  () => import("@/components/scanner/qr-camera-scanner").then((m) => m.QrCameraScanner),
  { ssr: false },
);

/**
 * Pure input surface: camera on top, manual reference entry always visible
 * below it (not a fallback-only field — a hardware barcode-scanner "gun"
 * emulates a keyboard, so it needs a focused text input same as someone
 * typing a reference by hand). Emits the raw decoded/typed string;
 * interpreting and resolving it is the caller's job (see ScannerFlow).
 */
export function ScanInputPanel({
  onValue,
  busy,
}: {
  onValue: (raw: string) => void;
  busy: boolean;
}) {
  const [manualValue, setManualValue] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const debounceRef = useRef(0);

  function emit(raw: string) {
    // Camera can fire onScan repeatedly for the same code before the
    // parent has a chance to react; a short debounce avoids double-submits.
    const now = Date.now();
    if (now - debounceRef.current < 1500) return;
    debounceRef.current = now;
    onValue(raw);
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!manualValue.trim()) return;
    emit(manualValue.trim());
    setManualValue("");
  }

  return (
    <div className="space-y-4">
      {cameraError ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
          <CameraOff className="size-6 text-muted-foreground" aria-hidden />
          <p className="max-w-xs text-sm text-muted-foreground">{cameraError}</p>
        </div>
      ) : (
        <QrCameraScanner onDecode={emit} onError={(message) => setCameraError(message)} />
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
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={busy || !manualValue}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
          </Button>
        </div>
      </form>
    </div>
  );
}
