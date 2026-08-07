import { appConfig } from "@/lib/config";

/**
 * URL encoded into every printed QR label. A URL (rather than the bare
 * token) means the label is scannable by any camera app, not just ours —
 * Phase 5 implements the /dossiers/qr/[token] route this points at, which
 * resolves the token and hands off into the scan-confirmation flow.
 *
 * This format is effectively permanent once labels are printed — don't
 * change it without a migration plan for already-printed dossiers.
 */
export function qrPayloadUrl(qrToken: string): string {
  return `${appConfig.appUrl}/dossiers/qr/${qrToken}`;
}
