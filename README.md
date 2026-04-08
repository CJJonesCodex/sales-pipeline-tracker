# Sales Pipeline Tracker (V1 + Milestone 2.5)

Beginner-friendly web app shell for discovering local companies, importing them into a CRM-style workflow, reviewing contacts, and drafting outreach.

## What is included in this scaffold

- Next.js (App Router) + TypeScript + Tailwind CSS
- Route structure for V1 screens:
  - `/login`
  - `/dashboard`
  - `/companies` (search/import)
  - `/companies/[id]` (detail)
  - `/contacts`
  - `/pipeline`
- Reusable component structure for layout, tables, badges, and pipeline board
- Supabase auth wiring (login, logout, middleware route protection)
- Supabase SQL schema + migration snapshot with RLS policies for:
  - `companies`
  - `contacts`
  - `discovery_runs`
  - `outreach_attempts`

## What is now real (Supabase-backed)

The CRM views now use Supabase as the source of truth for persistence:

- `/companies`
  - loads imported companies from `companies`
  - import action writes selected mock search results into `companies`
- `/companies/[id]`
  - reads company data from `companies`
  - saves notes and pipeline stage to `companies`
  - reads related contacts from `contacts`
  - reads discovery history from `discovery_runs`
  - creates/updates outreach attempts in `outreach_attempts`
- `/contacts`
  - reads contacts from `contacts`
  - updates contact fields in `contacts`
- `/pipeline`
  - loads pipeline columns from `companies`
  - persists stage updates to `companies`
- `/dashboard`
  - uses Supabase-backed counts for imported companies and contacts

## What still uses mock data

Still intentionally mocked in Milestone 2.5:

- company search providers (business listing APIs)
- website verification APIs and scoring inputs
- crawling/extraction from live websites
- AI summaries and AI outreach draft generation
- outbound email sending

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase (auth + schema/RLS + CRM persistence)

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```

### 3) Apply database schema in Supabase

Run either SQL file in the Supabase SQL editor:

- `supabase/schema.sql`
- `supabase/migrations/20260408190000_milestone2_schema.sql`

### 4) Run development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5) Type-check and lint

```bash
npm run typecheck
npm run lint
```

### 6) Build for production

```bash
npm run build
npm run start
```

## Project structure

```text
src/
  app/
    login/
    (app)/
      dashboard/
      companies/
      contacts/
      pipeline/
  components/
    layout/
    ui/
    companies/
    contacts/
    pipeline/
  lib/
    auth/
    mock-data/
    services/
    supabase/
    types.ts
supabase/
  schema.sql
  migrations/
```

## Notes for future milestones

- Keep replacing mock providers (search/verification/crawl/AI) with real integrations behind reliable jobs.
- Consider adding DB triggers for automatic `updated_at` management.
- Add richer contact and outreach editing UX with optimistic updates.
