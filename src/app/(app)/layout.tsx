import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getAppSettings } from "@/lib/data/app-settings";
import { navItemsForRole } from "@/lib/auth/nav-items";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { CacheProfileOnLoad } from "@/components/offline/cache-profile-on-load";

/**
 * Shared shell for every authenticated screen: top bar (org + user menu)
 * and a role-filtered bottom nav. src/proxy.ts already blocks
 * unauthenticated requests before they reach here — the redirect below is
 * defense in depth for the "profile missing/deactivated mid-session" edge
 * case (e.g. an admin deactivates the account while it's logged in
 * elsewhere).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, settings] = await Promise.all([getCurrentProfile(), getAppSettings()]);

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  const items = navItemsForRole(profile.role);

  return (
    <div className="flex min-h-screen flex-col">
      <CacheProfileOnLoad profile={profile} />
      <AppHeader
        orgName={settings.orgName}
        logoUrl={settings.logoUrl}
        fullName={profile.full_name}
        roleLabel={ROLE_LABELS[profile.role]}
        serviceName={profile.service_name}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 print:p-0">{children}</main>
      <AppNav items={items} />
    </div>
  );
}
