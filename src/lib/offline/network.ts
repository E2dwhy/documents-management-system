export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * `navigator.onLine` only means "connected to some network" — a captive
 * portal or a dead wifi AP still reports true. Before attempting a sync we
 * confirm Supabase itself actually answers, with a short timeout so a
 * flaky connection fails fast instead of hanging the UI.
 */
export async function isSupabaseReachable(timeoutMs = 4000): Promise<boolean> {
  if (!isOnline()) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
