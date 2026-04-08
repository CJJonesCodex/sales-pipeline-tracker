# Sales Pipeline Tracker (V1 + Milestone 3.5)

Beginner-friendly web app for discovering local companies, importing them into a CRM-style workflow, crawling public business pages for contacts, and generating AI-assisted company/outreach content.

## What is included

- Next.js (App Router) + TypeScript + Tailwind CSS
- Route structure:
  - `/login`
  - `/dashboard`
  - `/companies` (search/import)
  - `/companies/[id]` (detail + crawl + AI)
  - `/contacts`
  - `/pipeline`
- Supabase auth wiring (login, logout, middleware route protection)
- Supabase SQL schema with RLS policies for:
  - `companies`
  - `contacts`
  - `discovery_runs`
  - `outreach_attempts`

## What is now real (Supabase-backed in Milestone 3.5)

The CRM views now use Supabase as the source of truth for persistence:

- `/companies`
  - supports area search input (zip/address + radius)
  - runs mocked company discovery for that area
  - import action writes selected discovery results into `companies`
  - prevents duplicate imports via `user_id + external_place_id` upsert conflict handling
  - shows loading, empty, success, and error states for discovery/import flow
  - loads imported companies from `companies`
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

## What still uses mock data in Milestone 3.5

Still intentionally mocked in Milestone 3.5:

- company search providers (business listing APIs)
- website verification APIs and scoring inputs
- crawling/extraction from live websites
- AI summaries and AI outreach draft generation
- outbound email sending


## Milestone 3.5: Search + Discovery behavior

### Real in Milestone 3.5

- Authentication and protected app routes
- Supabase persistence for CRM entities (`companies`, `contacts`, `discovery_runs`, `outreach_attempts`)
- Importing discovered companies into the real `companies` table
- Company detail, contacts, dashboard, and pipeline pages backed by Supabase

### Mocked in Milestone 3.5

- Area discovery provider for finding companies by zip/address and radius (mock dataset + mock distance matching)
- Website verification provider and confidence scoring inputs
- Live website crawling and deterministic extraction from real company websites
- AI summary and AI outreach generation internals
- Autonomous email sending

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
OPENAI_API_KEY=optional_for_real_ai_generation
```

### 3) Apply database schema in Supabase

Run either:

- `supabase/schema.sql` for a fresh setup, or
- base migration `supabase/migrations/20260408190000_milestone2_schema.sql` then `supabase/migrations/20260408210000_milestone456_schema_updates.sql`

### 4) Run development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5) Type-check, lint, and build

```bash
npm run typecheck
npm run lint
npm run build
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
