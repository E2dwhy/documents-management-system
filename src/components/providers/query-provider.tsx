"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * TanStack Query provider. A fresh QueryClient is created once per browser
 * tab (via useState) so server-rendered pages never leak cached data
 * between requests/users.
 *
 * Defaults are tuned for a flaky-connectivity, mobile field-use app:
 * data is kept fairly fresh but retries are limited so a scan screen
 * doesn't hang for a long time trying to refetch on a dead connection —
 * the offline queue (Phase 6) is the real answer to "no network".
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
