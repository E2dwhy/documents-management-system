/**
 * The register_scan/create_dossier/close_dossier/... RPCs (see
 * supabase/migrations/20260806120100_functions.sql) raise plain
 * `CODE: detail` exceptions. This maps the code prefix to a French
 * message — shared by every phase that calls one of those RPCs.
 */
const PREFIX_MESSAGES: [prefix: string, message: string][] = [
  ["FORBIDDEN", "Action non autorisée pour votre rôle ou votre service."],
  ["INVALID_INPUT", "Données invalides. Vérifiez le formulaire."],
  ["NOT_FOUND", "Dossier introuvable."],
  ["DOSSIER_LOCKED", "Ce dossier est clôturé et ne peut plus être modifié."],
  ["NOT_READY", "Ce dossier n'a pas encore atteint sa dernière étape."],
  ["NOT_CLOSED", "Ce dossier n'est pas clôturé."],
];

export function translateRpcError(message?: string | null): string {
  if (!message) return "Une erreur est survenue. Veuillez réessayer.";
  const match = PREFIX_MESSAGES.find(([prefix]) => message.startsWith(prefix));
  return match?.[1] ?? "Une erreur est survenue. Veuillez réessayer.";
}
