"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CloudOff, Loader2, RefreshCw, RotateCw, Trash2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useOutbox } from "@/hooks/use-outbox";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { syncOutbox, retryOutboxItem, discardOutboxItem } from "@/lib/offline/sync";
import { formatDateTime } from "@/lib/date";
import { MOUVEMENT_ACTION_LABELS } from "@/lib/dossiers/status";

export function SyncStatusBadge() {
  const { items, count } = useOutbox();
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const [isSyncing, startSync] = useTransition();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  if (count === 0) return null;

  function handleSyncNow() {
    startSync(async () => {
      const summary = await syncOutbox();
      if (summary.synced > 0) {
        toast.success(`${summary.synced} mouvement${summary.synced > 1 ? "s" : ""} synchronisé${summary.synced > 1 ? "s" : ""}.`);
      }
      if (summary.rejected > 0) {
        toast.error(`${summary.rejected} en conflit — voir la liste.`);
      }
      if (summary.synced === 0 && summary.rejected === 0 && summary.stillPending > 0) {
        toast.info("Toujours hors ligne.");
      }
    });
  }

  async function handleRetry(clientUuid: string) {
    setRetryingId(clientUuid);
    try {
      const result = await retryOutboxItem(clientUuid);
      if (result?.outcome === "synced") toast.success("Mouvement synchronisé.");
      else if (result?.outcome === "rejected") toast.error(result.message);
      else if (result?.outcome === "queued") toast.info("Toujours hors ligne.");
    } finally {
      setRetryingId(null);
    }
  }

  async function handleDiscard(clientUuid: string) {
    await discardOutboxItem(clientUuid);
    toast("Mouvement ignoré.");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="File d'attente de synchronisation">
          {isOnline ? <CloudOff className="size-5" aria-hidden /> : <WifiOff className="size-5" aria-hidden />}
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-medium text-white">
            {count}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>En attente de synchronisation ({count})</SheetTitle>
          <SheetDescription>
            {isOnline
              ? "Ces mouvements seront envoyés dès que possible."
              : "Hors ligne — ces mouvements seront envoyés automatiquement au retour du réseau."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto px-4 pb-4">
          {items.map((item) => (
            <div key={item.clientUuid} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.dossierReference}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.dossierTitle}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {MOUVEMENT_ACTION_LABELS[item.action]}
                {item.note ? ` · ${item.note}` : ""}
              </p>
              {item.status === "error" ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-destructive">{item.errorMessage}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={retryingId === item.clientUuid}
                      onClick={() => void handleRetry(item.clientUuid)}
                    >
                      {retryingId === item.clientUuid ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <RotateCw className="size-3.5" aria-hidden />
                      )}
                      Réessayer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-destructive"
                      onClick={() => void handleDiscard(item.clientUuid)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Ignorer
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">En attente</p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <Button className="w-full" onClick={handleSyncNow} disabled={isSyncing || !isOnline}>
            {isSyncing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
            Synchroniser maintenant
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
