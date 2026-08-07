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

export function translateAuthError(message: string): string {
  return MESSAGES[message] ?? "Une erreur est survenue. Veuillez réessayer.";
}
