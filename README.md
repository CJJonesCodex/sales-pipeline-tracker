# Sales Pipeline Tracker (Milestones 4, 5, and 6)

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

## What is now real

- Provider-backed area search by zip/address + radius:
  - geocoding via OpenStreetMap Nominatim
  - business listings via Overpass
  - normalized output fields (name, formatted address, phone, website, provider id)
- Website verification status scoring:
  - `verified`
  - `likely`
  - `mismatch`
  - `missing`
- Stronger duplicate prevention on import:
  - external provider id match
  - website domain match
  - normalized company name + address match
- Import to Supabase `companies` with provider metadata and website verification status
- Public-page crawl flow from company detail page (`/`, `/contact`, `/about`, `/team`, `/staff`, `/leadership`, `/company`)
- Deterministic extraction and storage of:
  - emails
  - phone numbers
  - names
  - professional titles
  - short bio snippets
  - source URLs/page titles
- Discovery run persistence in Supabase (`discovery_runs`), including scanned URLs
- Contact confidence + review state persistence (`review_status`)
- AI-assisted company summary and outreach draft generation:
  - real OpenAI Responses API usage when `OPENAI_API_KEY` is configured
  - readable deterministic fallback when key is not configured

## What is still mocked

- Search provider fallback still uses local mock data when OpenStreetMap provider requests fail or return no usable rows.
- Outbound email sending remains intentionally mocked (draft/review only).
- Contact extraction still uses deterministic parsing heuristics (not a full crawler stack with JS rendering).

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
