import { QrCode } from "lucide-react";
import { appConfig } from "@/lib/config";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader({
  fullName,
  roleLabel,
  serviceName,
}: {
  fullName: string;
  roleLabel: string;
  serviceName: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <QrCode className="size-5 shrink-0" aria-hidden />
          <span className="truncate text-sm font-semibold">{appConfig.orgName}</span>
        </div>
        <UserMenu fullName={fullName} roleLabel={roleLabel} serviceName={serviceName} />
      </div>
    </header>
  );
}
