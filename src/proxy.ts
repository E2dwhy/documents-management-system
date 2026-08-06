import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase session cookie on every navigable request.
 * Route-guard redirects (login required, role checks) are added in Phase 3
 * once auth pages exist — see `src/lib/supabase/middleware.ts`.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - sw.js (Serwist service worker)
     * - manifest.webmanifest, icons, favicon
     * - image/font files
     */
    "/((?!_next/static|_next/image|sw\\.js|manifest\\.webmanifest|favicon\\.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
