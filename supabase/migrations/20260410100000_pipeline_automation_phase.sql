-- Milestone 4: pipeline automation + lead qualification

alter table public.companies
  add column if not exists last_touched_at timestamptz not null default now(),
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists next_recommended_action text not null default 'Verify official website';

alter table public.contacts
  add column if not exists is_primary boolean not null default false;

update public.companies
set pipeline_stage = case pipeline_stage
  when 'Lead' then 'new'
  when 'Qualified' then 'qualified'
  when 'Contacted' then 'contacted'
  when 'Proposal' then 'draft_ready'
  when 'Won' then 'won'
  when 'Lost' then 'lost'
  else pipeline_stage
end;

alter table public.companies drop constraint if exists companies_pipeline_stage_check;
alter table public.companies
  add constraint companies_pipeline_stage_check
  check (pipeline_stage in (
    'new',
    'website_verified',
    'contacts_found',
    'best_contact_selected',
    'draft_ready',
    'contacted',
    'follow_up_due',
    'replied',
    'qualified',
    'won',
    'lost'
  ));
