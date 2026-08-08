import type { DossierRow, MouvementRow } from "@/lib/data/dossiers";
import type { DossierType, Service } from "@/lib/data/reference-data";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

export type OutboxStatus = "pending" | "syncing" | "error";

/**
 * One queued scan mutation. `clientUuid` is both the IndexedDB key and the
 * idempotency key sent to register_scan — the same id is used whether the
 * item syncs immediately (effectively online) or sits pending for a while
 * (offline), so a replay after reconnecting can never double-count.
 */
export interface OutboxItem {
  clientUuid: string;
  dossierId: string;
  dossierReference: string; // display only
  dossierTitle: string; // display only
  action: "scan" | "transfert";
  toServiceId: string | null;
  newStatus: "en_cours" | "valide" | "rejete" | null;
  note: string | null;
  createdAt: string; // ISO — when the user confirmed the action, not when it synced
  status: OutboxStatus;
  errorMessage?: string;
}

/** A mouvement row with names already resolved, so offline rendering needs
 * no further lookups. */
export interface CachedMouvement extends MouvementRow {
  actorName: string | null;
  fromServiceName: string | null;
  toServiceName: string | null;
}

export interface CachedDossierSnapshot {
  reference: string; // key
  qrToken: string;
  dossier: DossierRow;
  typeLabel: string;
  currentServiceName: string | null;
  mouvements: CachedMouvement[];
  cachedAt: string; // ISO
}

export interface CachedReferenceData {
  id: "singleton";
  services: Service[];
  types: DossierType[];
  cachedAt: string;
}

export interface CachedProfileEntry {
  id: "singleton";
  profile: CurrentProfile;
  cachedAt: string;
}
