"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, ScanLine, ClipboardList, Bell, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import type { NavItem, NavIconKey } from "@/lib/auth/nav-items";

/** lucide-react components can't be passed from the (server) AppLayout as
 * props — NAV_ITEMS carries a serializable icon key instead, resolved here. */
const ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  dossiers: FolderOpen,
  scanner: ScanLine,
  audit: ClipboardList,
  notifications: Bell,
  admin: Settings,
};

/**
 * Bottom tab bar, reachable one-handed — the primary nav on the phone-sized
 * viewports this app is built for. A desktop sidebar variant can reuse the
 * same `items` prop later (Phase 8 polish) without touching this file.
 */
export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {items.map(({ href, label, icon }) => {
          const Icon = ICONS[icon];
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const badge = href === "/notifications" && unreadCount > 0 ? unreadCount : null;
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {badge ? (
                    <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-semibold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
