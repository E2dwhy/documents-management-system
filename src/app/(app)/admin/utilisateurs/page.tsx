import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UsersManager } from "@/components/admin/users-manager";
import { getActiveServices } from "@/lib/data/reference-data";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [{ data: users }, services, { data: auth }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, service_id, is_active")
      .order("full_name"),
    getActiveServices(),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Inviter, modifier le rôle/service, ou désactiver un compte.
        </p>
      </div>
      <UsersManager users={users ?? []} services={services} currentUserId={auth.user?.id ?? ""} />
    </div>
  );
}
