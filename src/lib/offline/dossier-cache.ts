import { getOfflineDb } from "@/lib/offline/db";
import type {
  CachedDossierSnapshot,
  CachedReferenceData,
  CachedProfileEntry,
} from "@/lib/offline/types";
import type { Service, DossierType } from "@/lib/data/reference-data";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

export async function cacheDossierSnapshot(snapshot: CachedDossierSnapshot): Promise<void> {
  const db = await getOfflineDb();
  await db.put("dossiers", snapshot);
}

export async function getCachedDossierByReference(
  reference: string,
): Promise<CachedDossierSnapshot | undefined> {
  const db = await getOfflineDb();
  return db.get("dossiers", reference);
}

export async function getCachedDossierByQrToken(
  qrToken: string,
): Promise<CachedDossierSnapshot | undefined> {
  const db = await getOfflineDb();
  return db.getFromIndex("dossiers", "by-qrToken", qrToken);
}

export async function cacheReferenceData(services: Service[], types: DossierType[]): Promise<void> {
  const db = await getOfflineDb();
  const entry: CachedReferenceData = { id: "singleton", services, types, cachedAt: new Date().toISOString() };
  await db.put("referenceData", entry);
}

export async function getCachedReferenceData(): Promise<CachedReferenceData | undefined> {
  const db = await getOfflineDb();
  return db.get("referenceData", "singleton");
}

export async function cacheProfile(profile: CurrentProfile): Promise<void> {
  const db = await getOfflineDb();
  const entry: CachedProfileEntry = { id: "singleton", profile, cachedAt: new Date().toISOString() };
  await db.put("profile", entry);
}

export async function getCachedProfile(): Promise<CurrentProfile | undefined> {
  const db = await getOfflineDb();
  const entry = await db.get("profile", "singleton");
  return entry?.profile;
}
