-- Milestone 5: outreach engine + follow-up automation

alter table public.companies
  add column if not exists primary_draft text not null default '',
  add column if not exists outreach_draft_status text not null default 'not_started'
    check (outreach_draft_status in ('not_started', 'generated', 'ready')),
  add column if not exists outreach_send_status text not null default 'not_contacted'
    check (outreach_send_status in ('not_contacted', 'contacted', 'replied', 'qualified', 'won', 'lost', 'stopped')),
  add column if not exists first_contacted_at timestamptz,
  add column if not exists follow_up_due_at timestamptz,
  add column if not exists stop_reason text;

update public.companies
set follow_up_due_at = coalesce(follow_up_due_at, next_follow_up_at);

create table if not exists public.outreach_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  activity_type text not null check (activity_type in (
    'draft_generated',
    'draft_marked_ready',
    'contacted',
    'follow_up_scheduled',
    'stage_updated',
    'status_updated',
    'stopped'
  )),
  activity_note text not null default '',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.outreach_activities enable row level security;

create policy "outreach_activities_owner_all" on public.outreach_activities
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
