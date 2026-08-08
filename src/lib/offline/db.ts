import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  OutboxItem,
  CachedDossierSnapshot,
  CachedReferenceData,
  CachedProfileEntry,
} from "@/lib/offline/types";

interface OfflineDB extends DBSchema {
  outbox: {
    key: string; // clientUuid
    value: OutboxItem;
  };
  dossiers: {
    key: string; // reference
    value: CachedDossierSnapshot;
    indexes: { "by-qrToken": string };
  };
  referenceData: {
    key: string;
    value: CachedReferenceData;
  };
  profile: {
    key: string;
    value: CachedProfileEntry;
  };
}

const DB_NAME = "dms-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

/**
 * Single shared IndexedDB connection for the browser tab. Client-only —
 * every caller must be behind a "use client" boundary (or a dynamic
 * import), since `indexedDB` doesn't exist during SSR.
 */
export function getOfflineDb(): Promise<IDBPDatabase<OfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("outbox", { keyPath: "clientUuid" });

        const dossiers = db.createObjectStore("dossiers", { keyPath: "reference" });
        dossiers.createIndex("by-qrToken", "qrToken");

        db.createObjectStore("referenceData", { keyPath: "id" });
        db.createObjectStore("profile", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export type { OfflineDB };
