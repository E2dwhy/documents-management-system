"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScanInputPanel } from "@/components/scanner/scan-input-panel";
import { ScanConfirmation } from "@/components/scanner/scan-confirmation";
import { createClient } from "@/lib/supabase/client";
import { parseScanInput } from "@/lib/dossiers/parse-scan-input";
import { fetchAndCacheDossierSnapshot } from "@/lib/offline/fetch-dossier-snapshot";
import {
  cacheProfile,
  cacheReferenceData,
  getCachedDossierByQrToken,
  getCachedDossierByReference,
  getCachedProfile,
  getCachedReferenceData,
} from "@/lib/offline/dossier-cache";
import { isOnline } from "@/lib/offline/network";
import type { CachedDossierSnapshot } from "@/lib/offline/types";
import type { Service, DossierType } from "@/lib/data/reference-data";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

type Step =
  | { name: "input" }
  | { name: "confirm"; snapshot: CachedDossierSnapshot; fromCache: boolean; profile: CurrentProfile };

/**
 * The whole scan workflow (resolve -> confirm -> submit) lives on this one
 * client-rendered page rather than navigating to a per-dossier route for
 * the confirmation step. That's deliberate: Server Components need a live
 * round-trip to render, so a *new* page navigation can't work while fully
 * offline no matter how much we cache — staying on one already-loaded
 * client page is what makes "scan a dossier with zero connectivity" (not
 * just flaky connectivity) actually possible.
 */
export function ScannerFlow({
  services,
  types,
  profile,
}: {
  services: Service[];
  types: DossierType[];
  profile: CurrentProfile | null;
}) {
  const [step, setStep] = useState<Step>({ name: "input" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Best-effort priming of the caches this flow depends on, using
  // whatever the server already fetched for this page load.
  useEffect(() => {
    void cacheReferenceData(services, types);
    if (profile) void cacheProfile(profile);
  }, [services, types, profile]);

  async function resolve(raw: string) {
    const parsed = parseScanInput(raw);
    if (parsed.kind === "unrecognized") {
      setError(
        "Format non reconnu. Scannez une étiquette générée par l'application ou saisissez une référence (DOS-AAAA-NNNNN).",
      );
      return;
    }

    setBusy(true);
    setError(null);

    let snapshot: CachedDossierSnapshot | null = null;
    let fromCache = false;

    if (isOnline()) {
      try {
        const client = createClient();
        snapshot = await fetchAndCacheDossierSnapshot(
          client,
          parsed.kind === "reference" ? { reference: parsed.value } : { qrToken: parsed.value },
        );
      } catch {
        snapshot = null; // network hiccup mid-request — fall through to cache below
      }
    }

    if (!snapshot) {
      const cached =
        parsed.kind === "reference"
          ? await getCachedDossierByReference(parsed.value)
          : await getCachedDossierByQrToken(parsed.value);
      if (cached) {
        snapshot = cached;
        fromCache = true;
      }
    }

    if (!snapshot) {
      setBusy(false);
      setError(
        isOnline()
          ? "Aucun dossier ne correspond à ce code ou cette référence."
          : "Ce dossier n'est pas disponible hors ligne — consultez-le une première fois en ligne, puis réessayez.",
      );
      return;
    }

    const resolvedProfile = (await getCachedProfile()) ?? profile;
    if (!resolvedProfile) {
      setBusy(false);
      setError("Profil introuvable. Reconnectez-vous.");
      return;
    }

    setBusy(false);
    setStep({ name: "confirm", snapshot, fromCache, profile: resolvedProfile });
  }

  if (step.name === "confirm") {
    const { snapshot, fromCache, profile: stepProfile } = step;
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep({ name: "input" })} className="-ml-2">
          <ArrowLeft className="size-4" aria-hidden />
          Scanner un autre dossier
        </Button>
        <ScanConfirmationWithFallbackServices
          snapshot={snapshot}
          fromCache={fromCache}
          profile={stepProfile}
          servicesFromServer={services}
          onSubmitted={() => setStep({ name: "input" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScanInputPanel onValue={(raw) => void resolve(raw)} busy={busy} />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Falls back to the cached/server-provided services list when the
 * snapshot itself doesn't carry one — services can change after a dossier
 * was cached, so the *current* list (best effort) is preferred. */
function ScanConfirmationWithFallbackServices({
  snapshot,
  fromCache,
  profile,
  servicesFromServer,
  onSubmitted,
}: {
  snapshot: CachedDossierSnapshot;
  fromCache: boolean;
  profile: CurrentProfile;
  servicesFromServer: Service[];
  onSubmitted: () => void;
}) {
  const [services, setServices] = useState<Service[]>(servicesFromServer);

  useEffect(() => {
    if (servicesFromServer.length > 0) return;
    void getCachedReferenceData().then((cached) => {
      if (cached) setServices(cached.services);
    });
  }, [servicesFromServer]);

  return (
    <ScanConfirmation
      dossier={snapshot.dossier}
      typeLabel={snapshot.typeLabel}
      currentServiceName={snapshot.currentServiceName}
      services={services}
      profile={profile}
      mouvements={snapshot.mouvements}
      fromCache={fromCache}
      cachedAt={snapshot.cachedAt}
      onSubmitted={onSubmitted}
    />
  );
}
