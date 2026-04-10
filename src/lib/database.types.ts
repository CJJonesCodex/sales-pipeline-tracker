export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          user_id: string;
          external_place_id: string;
          company_name: string;
          website_url: string;
          website_status: "verified" | "likely" | "mismatch" | "missing";
          main_phone: string;
          formatted_address: string;
          city: string;
          state: string;
          zip: string;
          latitude: number;
          longitude: number;
          primary_category: string;
          pipeline_stage:
            | "new"
            | "website_verified"
            | "contacts_found"
            | "best_contact_selected"
            | "draft_ready"
            | "contacted"
            | "follow_up_due"
            | "replied"
            | "qualified"
            | "won"
            | "lost";
          notes: string;
          last_touched_at: string;
          next_follow_up_at: string | null;
          primary_draft: string;
          outreach_draft_status: "not_started" | "generated" | "ready";
          outreach_send_status: "not_contacted" | "contacted" | "replied" | "qualified" | "won" | "lost" | "stopped";
          first_contacted_at: string | null;
          follow_up_due_at: string | null;
          stop_reason: string | null;
          next_recommended_action: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          full_name: string;
          professional_title: string;
          bio_snippet: string;
          email: string;
          phone: string;
          contact_type: "person" | "department" | "generic inbox";
          confidence_score: number;
          source_url: string;
          source_page_title: string;
          verified_status: "verified" | "likely" | "unverified";
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["contacts"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
      };
      discovery_runs: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          started_at: string;
          finished_at: string;
          status: "queued" | "running" | "completed" | "failed";
          pages_scanned: number;
          emails_found: number;
          phones_found: number;
          contacts_found: number;
          error_log: string;
        };
        Insert: Omit<Database["public"]["Tables"]["discovery_runs"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["discovery_runs"]["Insert"]>;
      };
      outreach_attempts: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          sequence_number: number;
          channel: "email";
          draft_status: "drafted" | "ready" | "sent";
          subject_line: string;
          body_snapshot: string;
          drafted_at: string;
          sent_at: string | null;
          reply_received_at: string | null;
          bounce_at: string | null;
          status: "not_sent" | "sent" | "replied" | "bounced";
        };
        Insert: Omit<Database["public"]["Tables"]["outreach_attempts"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["outreach_attempts"]["Insert"]>;
      };
      outreach_activities: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          activity_type:
            | "draft_generated"
            | "draft_marked_ready"
            | "contacted"
            | "follow_up_scheduled"
            | "stage_updated"
            | "status_updated"
            | "stopped";
          activity_note: string;
          occurred_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["outreach_activities"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["outreach_activities"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
