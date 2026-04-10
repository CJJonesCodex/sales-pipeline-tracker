-- Sales Pipeline Tracker - Milestone 2 schema
-- Run this in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_place_id text not null,
  company_name text not null,
  website_url text not null default '',
  website_status text not null check (website_status in ('verified', 'likely', 'mismatch', 'missing')),
  main_phone text not null default '',
  formatted_address text not null default '',
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  latitude double precision not null default 0,
  longitude double precision not null default 0,
  primary_category text not null default '',
  pipeline_stage text not null check (pipeline_stage in ('new', 'website_verified', 'contacts_found', 'best_contact_selected', 'draft_ready', 'contacted', 'follow_up_due', 'replied', 'qualified', 'won', 'lost')),
  notes text not null default '',
  last_touched_at timestamptz not null default now(),
  next_follow_up_at timestamptz,
  primary_draft text not null default '',
  outreach_draft_status text not null default 'not_started' check (outreach_draft_status in ('not_started', 'generated', 'ready')),
  outreach_send_status text not null default 'not_contacted' check (outreach_send_status in ('not_contacted', 'contacted', 'replied', 'qualified', 'won', 'lost', 'stopped')),
  first_contacted_at timestamptz,
  follow_up_due_at timestamptz,
  stop_reason text,
  next_recommended_action text not null default 'Verify official website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, external_place_id)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  professional_title text not null default '',
  bio_snippet text not null default '',
  email text not null default '',
  phone text not null default '',
  contact_type text not null check (contact_type in ('person', 'department', 'generic inbox')),
  confidence_score numeric not null default 0,
  source_url text not null default '',
  source_page_title text not null default '',
  verified_status text not null check (verified_status in ('verified', 'likely', 'unverified')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  pages_scanned integer not null default 0,
  emails_found integer not null default 0,
  phones_found integer not null default 0,
  contacts_found integer not null default 0,
  error_log text not null default ''
);

create table if not exists public.outreach_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  sequence_number integer not null,
  channel text not null check (channel in ('email')),
  draft_status text not null check (draft_status in ('drafted', 'ready', 'sent')),
  subject_line text not null default '',
  body_snapshot text not null default '',
  drafted_at timestamptz not null,
  sent_at timestamptz,
  reply_received_at timestamptz,
  bounce_at timestamptz,
  status text not null check (status in ('not_sent', 'sent', 'replied', 'bounced'))
);

create table if not exists public.outreach_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  activity_type text not null check (activity_type in ('draft_generated', 'draft_marked_ready', 'contacted', 'follow_up_scheduled', 'stage_updated', 'status_updated', 'stopped')),
  activity_note text not null default '',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.outreach_attempts enable row level security;
alter table public.outreach_activities enable row level security;

create policy "companies_owner_all" on public.companies
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contacts_owner_all" on public.contacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "discovery_runs_owner_all" on public.discovery_runs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "outreach_attempts_owner_all" on public.outreach_attempts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "outreach_activities_owner_all" on public.outreach_activities
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
