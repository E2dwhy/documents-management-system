"use client";

import { SerwistProvider } from "@serwist/next/react";

/**
 * Registers the Serwist service worker (public/sw.js, built from
 * src/app/sw.ts) on mount. No-op in development (see next.config.ts).
 */
export function SwProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/sw.js" register reloadOnOnline>
      {children}
    </SerwistProvider>
  );
}
