/**
 * Supabase Auth (GoTrue) error messages are English and not meant for
 * end users. This maps the ones we're likely to hit to French; anything
 * unmapped falls back to a generic message rather than leaking raw
 * provider text into the UI.
 */
const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Identifiants invalides. Vérifiez votre email et votre mot de passe.",
  "Email not confirmed": "Adresse email non confirmée. Contactez un administrateur.",
  "User already registered": "Un compte existe déjà avec cet email.",
  "Email rate limit exceeded": "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
  "New password should be different from the old password.":
    "Le nouveau mot de passe doit être différent de l'ancien.",
  "Password should be at least 6 characters.": "Le mot de passe doit contenir au moins 6 caractères.",
  "Auth session missing!": "Votre session a expiré. Veuillez recommencer.",
};

/**
 * A few GoTrue messages interpolate dynamic values (the email address
 * itself), so they can't be matched by exact equality like the table
 * above — matched by substring instead. Confirmed live: Supabase rejects
 * addresses whose domain isn't a real TLD (e.g. the .demo domain this
 * project's own seed accounts use — deliberately fake so a demo can never
 * email a real person, at the cost of "mot de passe oublié" not actually
 * being deliverable for them).
 */
const PATTERN_MESSAGES: [pattern: string, message: string][] = [
  ["is invalid", "Adresse email invalide ou domaine non joignable."],
];

export function translateAuthError(message: string): string {
  if (MESSAGES[message]) return MESSAGES[message];
  const match = PATTERN_MESSAGES.find(([pattern]) => message.includes(pattern));
  return match?.[1] ?? "Une erreur est survenue. Veuillez réessayer.";
}
