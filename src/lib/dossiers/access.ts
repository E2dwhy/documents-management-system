import type { CurrentProfile } from "@/lib/auth/get-current-profile";
import type { DossierRow } from "@/lib/data/dossiers";

/**
 * Mirrors can_access_dossier() in supabase/migrations — kept in sync by
 * hand so the UI can show a clear reason *before* someone hits the RPC's
 * FORBIDDEN error, not just react to it after the fact.
 */
export function canAccessDossier(profile: CurrentProfile, dossier: DossierRow): boolean {
  if (profile.role === "admin" || profile.role === "auditeur") return true;
  return dossier.current_service_id === profile.service_id || dossier.created_by === profile.id;
}

/**
 * True when the next scan is the dossier's last step (scan_count + 1 =
 * max_scans). No transfer is allowed then — mirrors the FINAL_STEP check in
 * register_scan (supabase/migrations/20260926120000_no_transfer_at_final_step.sql).
 */
export function isFinalStep(dossier: DossierRow): boolean {
  return dossier.scan_count + 1 >= dossier.max_scans;
}

/** Returns a French reason the dossier can't be scanned right now, or null if it can. */
export function getScanBlockReason(profile: CurrentProfile, dossier: DossierRow): string | null {
  if (dossier.is_locked) {
    return "Ce dossier est clôturé et ne peut plus être scanné.";
  }
  if (profile.role === "auditeur") {
    return "Votre rôle (auditeur) est en lecture seule : vous ne pouvez pas scanner de dossier.";
  }
  if (!canAccessDossier(profile, dossier)) {
    return "Ce dossier est en dehors de votre service.";
  }
  return null;
}
