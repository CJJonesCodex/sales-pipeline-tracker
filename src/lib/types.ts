export type WebsiteStatus = "verified" | "likely" | "mismatch" | "missing";
export type OutreachDraftStatus = "not_started" | "generated" | "ready";
export type OutreachSendStatus = "not_contacted" | "contacted" | "replied" | "qualified" | "won" | "lost" | "stopped";
export type PipelineStage =
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

export type Company = {
  id: string;
  external_place_id: string;
  company_name: string;
  website_url: string;
  website_status: WebsiteStatus;
  main_phone: string;
  formatted_address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  primary_category: string;
  pipeline_stage: PipelineStage;
  notes: string;
  last_touched_at: string;
  next_follow_up_at: string | null;
  primary_draft: string;
  outreach_draft_status: OutreachDraftStatus;
  outreach_send_status: OutreachSendStatus;
  first_contacted_at: string | null;
  follow_up_due_at: string | null;
  stop_reason: string | null;
  next_recommended_action: string;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
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

export type DiscoveryRun = {
  id: string;
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

export type OutreachAttempt = {
  id: string;
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
