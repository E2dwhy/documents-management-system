const REFERENCE_PATTERN = /^DOS-\d{4}-\d{5}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QR_URL_TOKEN_PATTERN = /\/dossiers\/qr\/([0-9a-f-]{36})/i;

export type ParsedScanInput =
  | { kind: "reference"; value: string }
  | { kind: "qrToken"; value: string }
  | { kind: "unrecognized" };

/**
 * A scan/manual-entry input can be:
 *  - a typed dossier reference (DOS-2026-00123)
 *  - our own printed QR's URL payload (…/dossiers/qr/<token>) — decoded by
 *    the camera, or typed out by a hardware barcode scanner emulating a
 *    keyboard
 *  - a bare qr_token UUID, if some other scanner/integration emits just that
 */
export function parseScanInput(raw: string): ParsedScanInput {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "unrecognized" };

  if (REFERENCE_PATTERN.test(trimmed)) {
    return { kind: "reference", value: trimmed };
  }

  const qrUrlMatch = trimmed.match(QR_URL_TOKEN_PATTERN);
  if (qrUrlMatch) {
    return { kind: "qrToken", value: qrUrlMatch[1] };
  }

  if (UUID_PATTERN.test(trimmed)) {
    return { kind: "qrToken", value: trimmed };
  }

  return { kind: "unrecognized" };
}
