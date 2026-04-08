-- Milestones 4-6 schema updates

alter table public.companies
  add column if not exists provider_name text not null default 'mock' check (provider_name in ('osm-overpass', 'mock')),
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

alter table public.contacts
  add column if not exists review_status text not null default 'needs_review' check (review_status in ('needs_review', 'approved', 'rejected'));

alter table public.discovery_runs
  add column if not exists scanned_urls jsonb not null default '[]'::jsonb;
