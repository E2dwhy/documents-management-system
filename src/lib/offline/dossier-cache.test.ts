import { describe, it, expect } from "vitest";
import {
  cacheDossierSnapshot,
  getCachedDossierByReference,
  getCachedDossierByQrToken,
  cacheReferenceData,
  getCachedReferenceData,
  cacheProfile,
  getCachedProfile,
} from "./dossier-cache";
import type { CachedDossierSnapshot } from "./types";
import type { DossierRow } from "@/lib/data/dossiers";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

function makeDossierRow(overrides: Partial<DossierRow> = {}): DossierRow {
  return {
    id: crypto.randomUUID(),
    reference: "DOS-2026-00042",
    qr_token: crypto.randomUUID(),
    title: "Dossier test",
    owner_name: null,
    type_id: crypto.randomUUID(),
    current_service_id: crypto.randomUUID(),
    status: "en_cours",
    scan_count: 1,
    max_scans: 3,
    is_locked: false,
    created_by: null,
    closed_by: null,
    closed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<CachedDossierSnapshot> = {}): CachedDossierSnapshot {
  const dossier = makeDossierRow();
  return {
    reference: dossier.reference,
    qrToken: dossier.qr_token,
    dossier,
    typeLabel: "Demande d'attestation",
    currentServiceName: "Accueil",
    mouvements: [],
    cachedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("offline dossier cache", () => {
  it("caches and retrieves a snapshot by reference", async () => {
    const snapshot = makeSnapshot();
    await cacheDossierSnapshot(snapshot);

    const fetched = await getCachedDossierByReference(snapshot.reference);
    expect(fetched).toEqual(snapshot);
  });

  it("retrieves a snapshot by qr_token via the secondary index", async () => {
    const snapshot = makeSnapshot();
    await cacheDossierSnapshot(snapshot);

    const fetched = await getCachedDossierByQrToken(snapshot.qrToken);
    expect(fetched?.reference).toBe(snapshot.reference);
  });

  it("overwrites the previous snapshot for the same reference (last view wins)", async () => {
    const first = makeSnapshot({ dossier: makeDossierRow({ reference: "DOS-2026-00099", scan_count: 1 }) });
    first.reference = "DOS-2026-00099";
    await cacheDossierSnapshot(first);

    const second = { ...first, dossier: { ...first.dossier, scan_count: 2 }, cachedAt: new Date().toISOString() };
    await cacheDossierSnapshot(second);

    const fetched = await getCachedDossierByReference("DOS-2026-00099");
    expect(fetched?.dossier.scan_count).toBe(2);
  });

  it("returns undefined for an unknown reference or qr_token", async () => {
    expect(await getCachedDossierByReference("DOS-9999-99999")).toBeUndefined();
    expect(await getCachedDossierByQrToken(crypto.randomUUID())).toBeUndefined();
  });

  it("caches and retrieves reference data (services + dossier types)", async () => {
    await cacheReferenceData(
      [{ id: "s1", name: "Accueil" }],
      [{ id: "t1", name: "demande_attestation", label: "Demande d'attestation", max_scans: 2 }],
    );

    const cached = await getCachedReferenceData();
    expect(cached?.services).toHaveLength(1);
    expect(cached?.types[0]?.label).toBe("Demande d'attestation");
  });

  it("caches and retrieves the current profile", async () => {
    const profile: CurrentProfile = {
      id: crypto.randomUUID(),
      full_name: "Test Agent",
      email: "agent@test.local",
      role: "agent",
      service_id: crypto.randomUUID(),
      is_active: true,
      created_at: new Date().toISOString(),
      service_name: "Accueil",
    };
    await cacheProfile(profile);

    const cached = await getCachedProfile();
    expect(cached).toEqual(profile);
  });
});
