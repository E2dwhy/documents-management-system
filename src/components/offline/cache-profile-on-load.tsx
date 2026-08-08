"use client";

import { useEffect } from "react";
import { cacheProfile } from "@/lib/offline/dossier-cache";
import type { CurrentProfile } from "@/lib/auth/get-current-profile";

/** Invisible — keeps the offline profile cache fresh on every authenticated
 * page load, not just when /scanner happens to be visited first. */
export function CacheProfileOnLoad({ profile }: { profile: CurrentProfile }) {
  useEffect(() => {
    void cacheProfile(profile);
  }, [profile]);

  return null;
}
