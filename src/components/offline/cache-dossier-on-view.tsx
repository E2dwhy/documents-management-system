"use client";

import { useEffect } from "react";
import { cacheDossierSnapshot } from "@/lib/offline/dossier-cache";
import type { CachedDossierSnapshot } from "@/lib/offline/types";

/**
 * Invisible — writes the server-fetched dossier (already resolved: type
 * label, service name, mouvements with actor/service names) into
 * IndexedDB so the /scanner flow can look it up later even with zero
 * connectivity. Rendered on the dossier detail page.
 */
export function CacheDossierOnView({ snapshot }: { snapshot: CachedDossierSnapshot }) {
  useEffect(() => {
    void cacheDossierSnapshot(snapshot);
    // Re-cache whenever the underlying data actually changes (new
    // mouvement, status change, etc.), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.reference, snapshot.dossier.updated_at, snapshot.mouvements.length]);

  return null;
}
