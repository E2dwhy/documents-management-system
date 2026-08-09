"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserInviteDialog } from "@/components/admin/user-invite-dialog";
import { UserEditDialog } from "@/components/admin/user-edit-dialog";
import { toggleUserActiveAction } from "@/lib/actions/users";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database";
import type { Service } from "@/lib/data/reference-data";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  service_id: string | null;
  is_active: boolean;
}

export function UsersManager({
  users,
  services,
  currentUserId,
}: {
  users: UserRow[];
  services: Service[];
  currentUserId: string;
}) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const serviceNameById = new Map(services.map((s) => [s.id, s.name]));

  async function handleToggle(id: string, next: boolean) {
    setTogglingId(id);
    const result = await toggleUserActiveAction(id, next);
    if (result.status === "error") toast.error(result.message);
    setTogglingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
        <UserInviteDialog services={services} />
      </div>

      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{user.full_name}</p>
                {!user.is_active ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Désactivé
                  </Badge>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {user.email} · {ROLE_LABELS[user.role]}
                {user.service_id ? ` · ${serviceNameById.get(user.service_id) ?? ""}` : ""}
              </p>
            </div>

            {togglingId === user.id ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <Switch
                checked={user.is_active}
                disabled={user.id === currentUserId}
                onCheckedChange={(checked) => void handleToggle(user.id, checked)}
                aria-label={user.is_active ? "Désactiver" : "Activer"}
              />
            )}

            <UserEditDialog user={user} services={services} />
          </li>
        ))}
      </ul>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucun utilisateur pour le moment.</p>
      ) : null}
    </div>
  );
}
