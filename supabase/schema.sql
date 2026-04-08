-- Sales Pipeline Tracker - schema with Milestones 2 through 6
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
  pipeline_stage text not null check (pipeline_stage in ('Lead', 'Qualified', 'Contacted', 'Proposal', 'Won', 'Lost')),
  notes text not null default '',
  provider_name text not null default 'mock' check (provider_name in ('osm-overpass', 'mock')),
  provider_metadata jsonb not null default '{}'::jsonb,
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
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'approved', 'rejected')),
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
  scanned_urls jsonb not null default '[]'::jsonb,
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

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.outreach_attempts enable row level security;

drop policy if exists "companies_owner_all" on public.companies;
drop policy if exists "contacts_owner_all" on public.contacts;
drop policy if exists "discovery_runs_owner_all" on public.discovery_runs;
drop policy if exists "outreach_attempts_owner_all" on public.outreach_attempts;

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
