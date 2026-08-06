import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * All dates in the app are displayed in French (fr-FR), formatted for the
 * `Africa/Abidjan` timezone (UTC, no DST — so no conversion is actually
 * required, but we centralize formatting here so that changes stay in
 * one place).
 */

const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm";
const DATE_FORMAT = "dd/MM/yyyy";

export function formatDateTime(value: string | number | Date): string {
  return format(new Date(value), DATE_TIME_FORMAT, { locale: fr });
}

export function formatDate(value: string | number | Date): string {
  return format(new Date(value), DATE_FORMAT, { locale: fr });
}

export function formatRelative(value: string | number | Date): string {
  return formatDistanceToNow(new Date(value), { locale: fr, addSuffix: true });
}
