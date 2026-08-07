import { redirect } from "next/navigation";

/**
 * "/" is a protected route (see src/proxy.ts) — reaching this component at
 * all means the visitor is authenticated, so this is a pure redirect to
 * the real authenticated home. Unauthenticated visitors never get here;
 * the proxy sends them to /login first.
 */
export default function RootPage() {
  redirect("/dashboard");
}
