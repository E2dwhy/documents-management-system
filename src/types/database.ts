/**
 * Placeholder Supabase database types.
 *
 * Phase 2 introduces the real SQL schema (supabase/migrations). Once a
 * Supabase project is linked, regenerate this file with:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * Until then this minimal shape keeps `createClient<Database>()` compiling.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
