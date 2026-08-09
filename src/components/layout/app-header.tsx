import { UserMenu } from "@/components/layout/user-menu";
import { SyncStatusBadge } from "@/components/offline/sync-status-badge";
import { OrgBrand } from "@/components/layout/org-brand";

export function AppHeader({
  orgName,
  logoUrl,
  fullName,
  roleLabel,
  serviceName,
}: {
  orgName: string;
  logoUrl: string | null;
  fullName: string;
  roleLabel: string;
  serviceName: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
        <OrgBrand orgName={orgName} logoUrl={logoUrl} />
        <div className="flex items-center gap-1">
          <SyncStatusBadge />
          <UserMenu fullName={fullName} roleLabel={roleLabel} serviceName={serviceName} />
        </div>
      </div>
    </header>
  );
}
