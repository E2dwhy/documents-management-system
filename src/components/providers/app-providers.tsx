"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SwProvider } from "@/components/pwa/sw-provider";
import { OfflineSyncProvider } from "@/components/offline/offline-sync-provider";

/**
 * Single composition point for every client-side provider the app needs.
 * Kept separate from layout.tsx so the root layout can stay a (lighter)
 * server component.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SwProvider>
        <QueryProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <OfflineSyncProvider />
            <Toaster position="top-center" richColors closeButton />
          </TooltipProvider>
        </QueryProvider>
      </SwProvider>
    </ThemeProvider>
  );
}
