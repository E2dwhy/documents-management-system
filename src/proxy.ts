import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Paths reachable without a session. Everything else requires login —
 * deny by default, matching the RLS posture in supabase/migrations/.
 */
const PUBLIC_PATHS = ["/login", "/reset-password", "/update-password", "/auth/callback"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in: bounce away from the login/reset screens (but not
  // /update-password — that page is reached via a fresh recovery session
  // while technically "logged in", and must stay reachable).
  if (user && (pathname === "/login" || pathname === "/reset-password")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

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
