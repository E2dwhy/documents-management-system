"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, FolderOpen, ScanLine, ClipboardList, Bell, Settings, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
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

/** Tabs shown directly in the bar, at most this many — everything past
 * that (per the role-filtered `items` a given user gets) is grouped behind
 * the "Plus" tab instead of being dropped. Keeps the bar at <=4 tabs for
 * every role without hard-coding roles here. */
const MAX_PRIMARY_TABS = 3;

/**
 * Bottom tab bar, reachable one-handed — the primary nav on the phone-sized
 * viewports this app is built for. Only the first `MAX_PRIMARY_TABS` role-
 * filtered items get a direct tab; the rest live behind a "Plus" bottom
 * sheet, so the bar never grows past ~4 tabs regardless of role (admin was
 * the worst case, at 6 raw items) — nothing is removed, just regrouped.
 */
export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const primaryItems = items.slice(0, MAX_PRIMARY_TABS);
  const secondaryItems = items.slice(MAX_PRIMARY_TABS);
  const secondaryHasUnread = secondaryItems.some(
    (item) => item.href === "/notifications" && unreadCount > 0,
  );

  function renderBadge(href: string) {
    if (href === "/notifications" && unreadCount > 0) {
      return (
        <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      );
    }
    return null;
  }

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden"
      >
        <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
          {primaryItems.map(({ href, label, icon }) => {
            const Icon = ICONS[icon];
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
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
                    {renderBadge(href)}
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}

          {secondaryItems.length > 0 ? (
            <li className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-haspopup="dialog"
                className={cn(
                  "relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
                  secondaryItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <MoreHorizontal className="size-5 shrink-0" aria-hidden />
                  {secondaryHasUnread ? (
                    <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">Plus</span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>

      {secondaryItems.length > 0 ? (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <SheetHeader>
              <SheetTitle>Plus</SheetTitle>
            </SheetHeader>
            <ul className="space-y-1 px-4 pb-2">
              {secondaryItems.map(({ href, label, icon }) => {
                const Icon = ICONS[icon];
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                const badge = href === "/notifications" && unreadCount > 0 ? unreadCount : null;
                return (
                  <li key={href}>
                    <SheetClose asChild>
                      <Link
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive ? "bg-accent text-primary" : "text-foreground hover:bg-accent",
                        )}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        <span className="flex-1">{label}</span>
                        {badge ? (
                          <span className="flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {badge > 9 ? "9+" : badge}
                          </span>
                        ) : null}
                      </Link>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
