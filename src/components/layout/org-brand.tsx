import { QrCode } from "lucide-react";

/** Logo if the admin has uploaded one (src/app/(app)/admin/parametres),
 * otherwise the QR icon — used in the app header and every auth page so
 * both stay visually consistent as the org identity changes. */
export function OrgBrand({
  orgName,
  logoUrl,
  className,
}: {
  orgName: string;
  logoUrl?: string | null;
  className?: string;
}) {
  return (
    <div className={className ?? "flex min-w-0 items-center gap-2"}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Storage URL, no build-time optimization needed
        <img src={logoUrl} alt="" className="size-5 shrink-0 rounded-sm object-contain" width={20} height={20} />
      ) : (
        <QrCode className="size-5 shrink-0" aria-hidden />
      )}
      <span className="truncate text-sm font-semibold">{orgName}</span>
    </div>
  );
}
