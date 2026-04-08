export type WebsiteStatus = "verified" | "likely" | "mismatch" | "missing";
export type PipelineStage = "Lead" | "Qualified" | "Contacted" | "Proposal" | "Won" | "Lost";

export type CompanyProviderName = "osm-overpass" | "mock";

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
  provider_name: CompanyProviderName;
  provider_metadata: Record<string, string | number | boolean | null>;
  created_at: string;
  updated_at: string;
};

export type ContactReviewStatus = "needs_review" | "approved" | "rejected";

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
  review_status: ContactReviewStatus;
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
  scanned_urls: string[];
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

export type CompanyDiscoveryResult = {
  discovery_id: string;
  provider_place_id: string;
  company_name: string;
  formatted_address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  main_phone: string;
  website_url: string;
  primary_category: string;
  provider_name: CompanyProviderName;
  provider_metadata: Record<string, string | number | boolean | null>;
  website_status: WebsiteStatus;
};

export type ExtractedContactCandidate = {
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
  review_status: ContactReviewStatus;
};
