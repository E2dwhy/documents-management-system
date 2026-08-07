import { ShieldAlert } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

/**
 * /admin is admin-only. The bottom nav already hides this link from other
 * roles, but that's cosmetic — someone could still type the URL, so the
 * actual access check lives here (mirrors the RLS posture: enforce at the
 * source, not just in what the UI shows).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-base font-semibold">Accès refusé</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Cette section est réservée aux administrateurs.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
