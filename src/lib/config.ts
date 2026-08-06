/**
 * Application-wide constants sourced from environment variables, with safe
 * fallbacks for local development.
 */
export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  orgName: process.env.NEXT_PUBLIC_ORG_NAME ?? "Mon Organisation",
  timezone: process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Africa/Abidjan",
} as const;
