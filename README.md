# Sales Pipeline Tracker (V1 + Milestone 2)

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
- Mock data layer for:
  - company search results
  - website verification status and reasoning
  - contact discovery data
  - discovery run history
  - AI company summary text
  - AI outreach draft text
- Supabase auth wiring (login, logout, middleware route protection)
- Supabase SQL schema + migration snapshot with RLS policies for:
  - companies
  - contacts
  - discovery_runs
  - outreach_attempts

## What still uses mock data

This scaffold intentionally keeps core product flows usable even without external APIs.

Still mocked:
- business listing search APIs
- official website verification APIs
- live web crawling/extraction
- AI model calls
- outbound email sending
- persistent CRM reads/writes in the current UI views

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase (auth + schema/RLS scaffolding)

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

## Notes for next milestone

- Replace mock service functions with real database-backed reads/writes.
- Add Supabase-backed company import persistence and contact persistence.
- Add real discovery/crawler integrations behind background jobs.
