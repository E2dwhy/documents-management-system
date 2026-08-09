/**
 * Hand-authored Supabase database types, matching supabase/migrations/*.sql.
 *
 * This is a stand-in for the real generated file. Once a Supabase project is
 * linked, regenerate (and diff!) it with:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * Kept in sync by hand until then — every column/RPC here has a matching
 * line in supabase/migrations/.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "responsable_service" | "agent" | "auditeur";

export type DossierStatus = "en_cours" | "valide" | "rejete" | "cloture" | "archive";

export type MouvementAction =
  | "creation"
  | "scan"
  | "transfert"
  | "modification"
  | "cloture"
  | "reouverture";

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: boolean;
          org_name: string;
          logo_url: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          org_name?: string;
          logo_url?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          org_name?: string;
          logo_url?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          service_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          service_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          service_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      dossier_types: {
        Row: {
          id: string;
          name: string;
          label: string;
          max_scans: number;
          late_threshold_hours: number | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          label: string;
          max_scans: number;
          late_threshold_hours?: number | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          label?: string;
          max_scans?: number;
          late_threshold_hours?: number | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      dossiers: {
        Row: {
          id: string;
          reference: string;
          qr_token: string;
          title: string;
          owner_name: string | null;
          type_id: string;
          current_service_id: string | null;
          status: DossierStatus;
          scan_count: number;
          max_scans: number;
          is_locked: boolean;
          created_by: string | null;
          closed_by: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        // Present for type completeness (mirrors the real table shape) —
        // there is no RLS policy allowing a direct client insert/update:
        // every write goes through the RPCs below.
        Insert: {
          id?: string;
          reference: string;
          qr_token?: string;
          title: string;
          owner_name?: string | null;
          type_id: string;
          current_service_id?: string | null;
          status?: DossierStatus;
          scan_count?: number;
          max_scans: number;
          is_locked?: boolean;
          created_by?: string | null;
          closed_by?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dossiers"]["Insert"]>;
        Relationships: [];
      };
      mouvements: {
        Row: {
          id: string;
          dossier_id: string;
          action: MouvementAction;
          from_service_id: string | null;
          to_service_id: string | null;
          status_snapshot: string | null;
          step_number: number | null;
          performed_by: string | null;
          note: string | null;
          client_uuid: string | null;
          performed_at: string;
          created_at: string;
        };
        // Same note as dossiers.Insert — RPC-only in practice.
        Insert: {
          id?: string;
          dossier_id: string;
          action: MouvementAction;
          from_service_id?: string | null;
          to_service_id?: string | null;
          status_snapshot?: string | null;
          step_number?: number | null;
          performed_by?: string | null;
          note?: string | null;
          client_uuid?: string | null;
          performed_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mouvements"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          dossier_id: string | null;
          user_id: string | null;
          type: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id?: string | null;
          user_id?: string | null;
          type: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_dossier: {
        Args: {
          p_title: string;
          p_type_id: string;
          p_service_id: string;
          p_owner_name?: string | null;
        };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      register_scan: {
        Args: {
          p_dossier_id: string;
          p_action: "scan" | "transfert";
          p_client_uuid: string;
          p_to_service_id?: string | null;
          p_new_status?: "en_cours" | "valide" | "rejete" | null;
          p_note?: string | null;
          p_step_number?: number | null;
        };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      close_dossier: {
        Args: { p_dossier_id: string; p_note?: string | null };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      reopen_dossier: {
        Args: { p_dossier_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      update_dossier_metadata: {
        Args: {
          p_dossier_id: string;
          p_title?: string | null;
          p_owner_name?: string | null;
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      flag_late_dossiers: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      dossier_status: DossierStatus;
      mouvement_action: MouvementAction;
    };
    CompositeTypes: Record<string, never>;
  };
}
