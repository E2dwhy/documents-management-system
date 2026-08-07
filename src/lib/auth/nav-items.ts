import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderOpen, ScanLine, ClipboardList, Bell, Settings } from "lucide-react";
import type { UserRole } from "@/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
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
    icon: LayoutDashboard,
    roles: ["admin", "responsable_service", "agent", "auditeur"],
  },
  {
    href: "/dossiers",
    label: "Dossiers",
    icon: FolderOpen,
    roles: ["admin", "responsable_service", "agent", "auditeur"],
  },
  {
    href: "/scanner",
    label: "Scanner",
    icon: ScanLine,
    roles: ["admin", "responsable_service", "agent"],
  },
  {
    href: "/audit",
    label: "Audit",
    icon: ClipboardList,
    roles: ["admin", "auditeur"],
  },
  {
    href: "/notifications",
    label: "Alertes",
    icon: Bell,
    roles: ["admin", "responsable_service", "agent", "auditeur"],
  },
  {
    href: "/admin",
    label: "Administration",
    icon: Settings,
    roles: ["admin"],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
