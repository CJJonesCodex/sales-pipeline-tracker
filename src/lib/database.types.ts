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
          pipeline_stage: "Lead" | "Qualified" | "Contacted" | "Proposal" | "Won" | "Lost";
          notes: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
