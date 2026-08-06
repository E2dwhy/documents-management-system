import { QrCode } from "lucide-react";
import { appConfig } from "@/lib/config";

/**
 * Minimal top bar shown on public/unauthenticated pages. The authenticated,
 * role-aware app shell (with navigation per role) is built in Phase 3 once
 * auth exists.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
        <QrCode className="size-5 shrink-0" aria-hidden />
        <span className="truncate text-sm font-semibold">
          {appConfig.orgName} · Suivi de Dossiers
        </span>
      </div>
    </header>
  );
}
