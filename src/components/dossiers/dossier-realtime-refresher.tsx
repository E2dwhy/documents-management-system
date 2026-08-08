"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Invisible. The dossier detail page is a Server Component (for the usual
 * reasons — cookies-based RLS, no client bundle for the data-fetching
 * itself), so "live updates" here means: subscribe to changes on this one
 * dossier and its mouvements, and ask Next.js to re-fetch the server-
 * rendered content (router.refresh()) rather than trying to patch server
 * HTML from the client. Debounced slightly since a single scan touches
 * both tables (dossiers + mouvements) and would otherwise trigger two
 * refreshes back to back.
 */
export function DossierRealtimeRefresher({ dossierId }: { dossierId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    function scheduleRefresh() {
      clearTimeout(timeout);
      timeout = setTimeout(() => router.refresh(), 300);
    }

    const channel = supabase
      .channel(`dossier-${dossierId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dossiers", filter: `id=eq.${dossierId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mouvements", filter: `dossier_id=eq.${dossierId}` },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [dossierId, router]);

  return null;
}
