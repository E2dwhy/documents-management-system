import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkOnly } from "serwist";

// This declares the value of `injectionPoint` in next.config.ts.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Never cache Supabase API/auth/realtime traffic — the offline scan
    // queue (Phase 6) handles "no connectivity" for writes explicitly;
    // silently serving a stale cached response here would be worse than
    // a clear network error.
    {
      matcher: ({ url }) => url.hostname.endsWith(".supabase.co"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
