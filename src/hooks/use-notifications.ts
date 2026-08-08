"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

const NOTIFICATIONS_KEY = ["notifications"];
const UNREAD_COUNT_KEY = ["notifications", "unread-count"];

/**
 * RLS lets admin read every user's notifications (useful for other admin
 * tooling), but this page is a personal "Alertes" inbox, not a global
 * view — /audit already covers cross-user oversight. Every query here
 * explicitly scopes to the signed-in user rather than leaning on RLS's
 * broader admin visibility, so "my alerts" means the same thing for every
 * role including admin.
 */
async function currentUserId(supabase: ReturnType<typeof createClient>): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export interface EnrichedNotification extends NotificationRow {
  /** dossiers is keyed by reference in every route, not id — resolved here
   * so the UI can link straight to /dossiers/[reference] instead of
   * carrying raw uuids nobody can navigate to. Null if the dossier no
   * longer exists or isn't visible to this user (e.g. it moved to a
   * service they've since lost access to). */
  dossierReference: string | null;
}

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async (): Promise<EnrichedNotification[]> => {
      const supabase = createClient();
      const userId = await currentUserId(supabase);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = data ?? [];

      const dossierIds = [...new Set(rows.map((n) => n.dossier_id).filter((id): id is string => Boolean(id)))];
      if (dossierIds.length === 0) return rows.map((n) => ({ ...n, dossierReference: null }));

      const { data: dossiers } = await supabase.from("dossiers").select("id, reference").in("id", dossierIds);
      const referenceById = new Map((dossiers ?? []).map((d) => [d.id, d.reference]));

      return rows.map((n) => ({
        ...n,
        dossierReference: n.dossier_id ? (referenceById.get(n.dossier_id) ?? null) : null,
      }));
    },
  });
}

/** Small, separate query (not derived from useNotifications) so the nav
 * badge can poll a lightweight count without every page needing the full
 * notifications list in memory. */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const userId = await currentUserId(supabase);
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000, // catches notifications created by the hourly cron without a manual refresh
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    await queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
  };
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return async () => {
    const supabase = createClient();
    const userId = await currentUserId(supabase);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    await queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
  };
}
