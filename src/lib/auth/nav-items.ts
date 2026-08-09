import type { UserRole } from "@/types/database";

/** Key into the icon map that lives in the (client) AppNav component —
 * lucide-react components themselves can't cross the server/client
 * boundary, since a Server Component can only pass plain, serializable
 * data (see NAV_ITEMS below) to a Client Component. */
export type NavIconKey = "dashboard" | "dossiers" | "scanner" | "audit" | "notifications" | "admin";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  roles: UserRole[];
}

/**
 * Single source of truth for the authenticated nav — both the mobile
 * bottom bar and the desktop sidebar (Phase 8) read from this. Roles list
 * mirrors the matrix in the project brief: auditeur is read-only (no
 * Scanner), only admin gets Administration.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: "dashboard",
    roles: ["admin", "responsable_service", "agent", "auditeur"],
  },
  {
    href: "/dossiers",
    label: "Dossiers",
    icon: "dossiers",
    roles: ["admin", "responsable_service", "agent", "auditeur"],
  },
  {
    href: "/scanner",
    label: "Scanner",
    icon: "scanner",
    roles: ["admin", "responsable_service", "agent"],
  },
  {
    href: "/audit",
    label: "Audit",
    icon: "audit",
    roles: ["admin", "auditeur"],
  },
  {
    href: "/notifications",
    label: "Alertes",
    icon: "notifications",
    roles: ["admin", "responsable_service", "agent", "auditeur"],
  },
  {
    href: "/admin",
    label: "Administration",
    icon: "admin",
    roles: ["admin"],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
