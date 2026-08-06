import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for use in Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth session via Next.js cookies().
 *
 * NOTE: Server Components cannot write cookies. When called from a Server
 * Component the `setAll` call below will throw, which we swallow — the
 * session refresh is instead handled by `src/middleware.ts` on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );
}

/**
 * Privileged Supabase client using the service role key. Bypasses RLS.
 * Server-only (never import from a Client Component). Reserved for
 * Edge Functions / server-side administrative tasks (e.g. user invites).
 */
export function createServiceRoleClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op: the service role client never carries a user session.
        },
      },
    },
  );
}
