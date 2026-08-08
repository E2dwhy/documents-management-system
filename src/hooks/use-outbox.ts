"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOutboxItems, onOutboxChanged } from "@/lib/offline/outbox";

const OUTBOX_QUERY_KEY = ["offline-outbox"];

/** IndexedDB has no React reactivity of its own — this bridges outbox
 * mutations (enqueue/update/remove, all of which fire a DOM event) into a
 * TanStack Query cache so any component can just useOutbox(). */
export function useOutbox() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return onOutboxChanged(() => {
      queryClient.invalidateQueries({ queryKey: OUTBOX_QUERY_KEY });
    });
  }, [queryClient]);

  const query = useQuery({
    queryKey: OUTBOX_QUERY_KEY,
    queryFn: getOutboxItems,
    initialData: [],
  });

  return {
    items: query.data,
    count: query.data.length,
    isLoading: query.isLoading,
  };
}
