# Sales Pipeline Tracker (V1 + Milestone 3.5)

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

## What is now real (Supabase-backed in Milestone 3.5)

The CRM views now use Supabase as the source of truth for persistence:

- `/companies`
  - supports area search input (zip/address + radius)
  - runs mocked company discovery for that area
  - import action writes selected discovery results into `companies`
  - includes a one-click "Seed smoke-test path" action to create a predictable manual QA path
  - prevents duplicate imports via `user_id + external_place_id` upsert conflict handling
  - shows loading, empty, success, and error states for discovery/import flow
  - loads imported companies from `companies`
- `/companies/[id]`
  - reads company data from `companies`
  - saves notes and pipeline stage to `companies`
  - reads related contacts from `contacts`
  - reads discovery history from `discovery_runs`
  - supports "Find Contacts (mock run)" to create a mock discovery run + contacts for smoke testing
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

## Smoke-test readiness (exact checklist)

Use this exact sequence after signing in to verify the end-to-end app journey:

1. **Login**
   - Go to `/login` and sign in with a valid Supabase email/password.
   - Expected: redirect to `/dashboard`.
2. **Area search**
   - Go to `/companies`.
   - Enter `60601` and radius `10`, then click **Discover Companies**.
   - Expected: discovery results table appears.
3. **Company discovery results**
   - Confirm at least one mock result appears with website status badge.
   - Expected: each row shows company, address, website, phone, and action.
4. **Import into CRM**
   - Click **Import** for one discovery result.
   - Expected: success banner appears and company shows under **Imported Companies (Supabase)**.
5. **Company detail page**
   - Open the imported company via **View detail** or imported list link.
   - Expected: company profile, discovery runs panel, AI summary, AI outreach draft, and contacts section render.
6. **Contact discovery run**
   - On company detail page, click **Find Contacts (mock run)**.
   - Expected: success banner reports discovery completion and how many contacts were added.
7. **Contacts visible in UI**
   - Verify contacts appear in the company detail contacts section.
   - Go to `/contacts` and confirm those contacts appear there too.
8. **Pipeline update**
   - Go to `/pipeline`, change the company stage, and save.
   - Expected: stage updates in pipeline and reflects on company detail/dashboard.
9. **AI summary visible**
   - Return to company detail page and confirm **Mock AI Company Summary** is visible.
10. **Outreach draft visible**
    - On the same page, confirm **Mock Outreach Draft** is visible.

### Optional fast-path seed for manual QA

If you want a predictable baseline before running the checklist:

- Go to `/companies` and click **Seed smoke-test path**.
- Expected: success message with a link to an already-seeded company detail page.
- The seed path creates (idempotently): one imported company, one contact, one discovery run, and one outreach attempt.

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
