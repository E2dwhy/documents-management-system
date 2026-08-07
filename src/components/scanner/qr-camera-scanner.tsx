"use client";

import { Scanner, type IDetectedBarcode, type IScannerError } from "@yudiel/react-qr-scanner";

/**
 * Thin wrapper around @yudiel/react-qr-scanner so the rest of the app only
 * deals with a decoded string. Imported via next/dynamic with ssr:false
 * (see scanner-entry.tsx) — this touches camera APIs that don't exist
 * server-side.
 */
export function QrCameraScanner({
  onDecode,
  onError,
}: {
  onDecode: (rawValue: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Scanner
        onScan={(codes: IDetectedBarcode[]) => {
          const value = codes[0]?.rawValue;
          if (value) onDecode(value);
        }}
        onError={(error: IScannerError) => {
          onError(error.message ?? "Impossible d'accéder à la caméra.");
        }}
        formats={["qr_code"]}
        constraints={{ facingMode: "environment" }}
        allowMultiple={false}
        sound
        styles={{ container: { width: "100%" } }}
      />
    </div>
  );
}
