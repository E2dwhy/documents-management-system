"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, BellOff, Check, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/date";
import { cn } from "@/lib/utils";

export function NotificationsList({ isAdmin }: { isAdmin: boolean }) {
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isCheckingNow, startCheckNow] = useTransition();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  async function handleMarkRead(id: string) {
    setMarkingId(id);
    try {
      await markRead(id);
    } catch {
      toast.error("Impossible de marquer comme lu.");
    } finally {
      setMarkingId(null);
    }
  }

  function handleCheckNow() {
    startCheckNow(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("flag_late_dossiers");
      if (error) {
        toast.error("Échec de la vérification.");
        return;
      }
      toast.success(data > 0 ? `${data} nouvelle(s) alerte(s) créée(s).` : "Aucun nouveau dossier en retard.");
      void refetch();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
        </p>
        <div className="flex gap-2">
          {isAdmin ? (
            <Button variant="outline" size="sm" onClick={handleCheckNow} disabled={isCheckingNow}>
              {isCheckingNow ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <RefreshCw className="size-3.5" aria-hidden />}
              Vérifier maintenant
            </Button>
          ) : null}
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllRead().catch(() => toast.error("Échec de l'opération."))}
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Tout marquer comme lu
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">Impossible de charger les alertes.</p>
      ) : notifications && notifications.length > 0 ? (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                !n.is_read && "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
              )}
            >
              <Bell
                className={cn("mt-0.5 size-4 shrink-0", n.is_read ? "text-muted-foreground" : "text-amber-600 dark:text-amber-500")}
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm">{n.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatRelative(n.created_at)}</span>
                  {n.dossierReference ? (
                    <>
                      <span>·</span>
                      <Link href={`/dossiers/${n.dossierReference}`} className="underline underline-offset-2">
                        Voir le dossier
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>
              {!n.is_read ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={markingId === n.id}
                  onClick={() => void handleMarkRead(n.id)}
                  aria-label="Marquer comme lu"
                >
                  {markingId === n.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <BellOff className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Aucune alerte pour le moment.</p>
        </div>
      )}
    </div>
  );
}
