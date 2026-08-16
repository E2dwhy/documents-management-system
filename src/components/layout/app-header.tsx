import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { SyncStatusBadge } from "@/components/offline/sync-status-badge";
import { OrgBrand } from "@/components/layout/org-brand";
import { Button } from "@/components/ui/button";

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
          <Button asChild variant="ghost" size="icon" aria-label="Aide et tutoriel">
            <Link href="/aide">
              <HelpCircle className="size-5" aria-hidden />
            </Link>
          </Button>
          <SyncStatusBadge />
          <UserMenu fullName={fullName} roleLabel={roleLabel} serviceName={serviceName} />
        </div>
      </div>
    </header>
  );
}
