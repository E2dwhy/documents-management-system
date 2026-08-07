/**
 * Resolves Supabase connection env vars, supporting both the current key
 * system (publishable/secret, prefixed sb_publishable_/sb_secret_) and the
 * legacy one (anon/service_role, JWT-shaped) — whichever a given project
 * still uses. The @supabase/ssr clients accept either format as a plain
 * string, so no other code needs to know which one is in play.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Copy .env.example to .env.local and fill in your Supabase project's values.`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
}

/** Client-safe key (browser + server). */
export function getSupabasePublishableKey(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // legacy project fallback
  return required(value, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

/** Server-only key. Bypasses RLS — never import from a Client Component. */
export function getSupabaseSecretKey(): string {
  const value =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY; // legacy project fallback
  return required(value, "SUPABASE_SECRET_KEY");
}
