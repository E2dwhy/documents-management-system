"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { syncOutbox } from "@/lib/offline/sync";
import { getOutboxCount } from "@/lib/offline/outbox";

const PERIODIC_SYNC_MS = 60_000;

/**
 * Mounted once in AppProviders. Flushes the outbox:
 *  - once on mount (covers "app was opened already online with leftover
 *    queued items from a previous offline session"),
 *  - on the browser's `online` event,
 *  - every 60s as a safety net — `online` doesn't always fire reliably in
 *    every PWA/browser context, and this is cheap (isSupabaseReachable
 *    short-circuits immediately when there's nothing to sync or no
 *    connectivity).
 * Renders nothing; the visible part is SyncStatusBadge reading the same
 * outbox via useOutbox().
 */
export function OfflineSyncProvider() {
  const syncingRef = useRef(false);

  useEffect(() => {
    async function runSync(notifyIfSynced: boolean) {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        const before = await getOutboxCount();
        if (before === 0) return;

        const summary = await syncOutbox();
        if (notifyIfSynced && summary.synced > 0) {
          toast.success(
            `${summary.synced} mouvement${summary.synced > 1 ? "s" : ""} synchronisé${summary.synced > 1 ? "s" : ""}.`,
          );
        }
        if (summary.rejected > 0) {
          toast.error(
            `${summary.rejected} mouvement${summary.rejected > 1 ? "s" : ""} en conflit — à résoudre dans la file d'attente.`,
          );
        }
      } finally {
        syncingRef.current = false;
      }
    }

    void runSync(false);

    function handleOnline() {
      void runSync(true);
    }
    window.addEventListener("online", handleOnline);

    const interval = setInterval(() => void runSync(true), PERIODIC_SYNC_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  return null;
}
