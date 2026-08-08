import type { DossierStatus, MouvementAction } from "@/types/database";

export const STATUS_LABELS: Record<DossierStatus, string> = {
  en_cours: "En cours",
  valide: "Validé",
  rejete: "Rejeté",
  cloture: "Clôturé",
  archive: "Archivé",
};

/** Tailwind classes for the shadcn Badge — kept out of components so the
 * palette stays consistent everywhere a status is shown (list, detail,
 * dashboard in Phase 7). */
export const STATUS_BADGE_CLASSES: Record<DossierStatus, string> = {
  en_cours: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  valide: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  rejete: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  cloture: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200",
  archive: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400",
};

/** CSS custom properties (src/app/globals.css) for the dashboard charts —
 * the dataviz skill's validated categorical palette, assigned in its
 * validated adjacent-safe order. Identity color, not a judgment — the
 * "en retard" alerting uses the separate reserved status palette
 * (--status-good/--status-critical), never these. */
export const STATUS_CHART_COLORS: Record<DossierStatus, string> = {
  en_cours: "var(--chart-1)",
  rejete: "var(--chart-2)",
  valide: "var(--chart-3)",
  cloture: "var(--chart-4)",
  archive: "var(--chart-5)",
};

export const MOUVEMENT_ACTION_LABELS: Record<MouvementAction, string> = {
  creation: "Création",
  scan: "Scan",
  transfert: "Transfert",
  modification: "Modification",
  cloture: "Clôture",
  reouverture: "Réouverture",
};
