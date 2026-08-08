import type { Metadata } from "next";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export const metadata: Metadata = { title: "Alertes" };

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Alertes</h1>
      <NotificationsList isAdmin={profile?.role === "admin"} />
    </div>
  );
}
