import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client for use in Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth session via Next.js cookies().
 *
 * NOTE: Server Components cannot write cookies. When called from a Server
 * Component the `setAll` call below will throw, which we swallow — the
 * session refresh is instead handled by `src/proxy.ts` on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — safe to ignore, see note above.
        }
      },
    },
  });
}

/**
 * Privileged Supabase client using the secret key. Bypasses RLS.
 * Server-only (never import from a Client Component). Reserved for
 * Edge Functions / server-side administrative tasks (e.g. user invites).
 */
export function createServiceRoleClient() {
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op: the service role client never carries a user session.
      },
    },
  });
}
