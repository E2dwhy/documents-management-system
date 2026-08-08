export type PeriodFilter = "all" | "7" | "30" | "90";

export const PERIOD_LABELS: Record<PeriodFilter, string> = {
  all: "Toute période",
  "7": "7 derniers jours",
  "30": "30 derniers jours",
  "90": "90 derniers jours",
};

export function periodStartIso(period: PeriodFilter): string | null {
  if (period === "all") return null;
  const days = Number(period);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/** Strip PostgREST .or() syntax characters so free-text search can't break
 * the filter string (commas/parens are logic separators there). */
export function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,()%]/g, " ").trim();
}
