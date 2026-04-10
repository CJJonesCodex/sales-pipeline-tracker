# Sales Pipeline Tracker (V1 + Milestone 5)

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
- Supabase auth wiring (anonymous demo login, logout, middleware route protection)
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

## Milestone 5: Outreach Engine + Follow-up Automation

### Outreach lifecycle statuses

Each company now stores outreach lifecycle state directly in `companies`:

- `outreach_draft_status`
  - `not_started`
  - `generated`
  - `ready`
- `outreach_send_status`
  - `not_contacted`
  - `contacted`
  - `replied`
  - `qualified`
  - `won`
  - `lost`
  - `stopped`

### New outreach fields persisted per company

- `primary_draft` (main draft text snapshot shown in UI)
- `outreach_draft_status`
- `outreach_send_status`
- `first_contacted_at`
- `follow_up_due_at`
- `last_touched_at` (existing, now updated by outreach transitions)
- `stop_reason`

### Outreach activity timeline

Company detail now includes an outreach timeline powered by a new table:

- `outreach_activities`
  - stores activity type, note, and timestamp
  - records lifecycle events like draft generation, draft-ready, contacted, follow-up scheduling, and stop/loss updates

### Follow-up timing behavior

- Follow-up remains human-controlled.
- User picks a follow-up date from Company Detail.
- App persists date to both:
  - `follow_up_due_at` (new outreach lifecycle field)
  - `next_follow_up_at` (existing pipeline compatibility field)
- Pipeline recommendations update to instruct follow-up using that due date.

### Human-approved send policy (still enforced)

- App does **not** send outbound emails automatically.
- Lifecycle actions only mark readiness, contacted state, and outcomes after human action.



## Milestone 4: Pipeline Automation + Lead Qualification

### Standard pipeline stages

Companies now move through a standardized lead journey:

- `new`
- `website_verified`
- `contacts_found`
- `best_contact_selected`
- `draft_ready`
- `contacted`
- `follow_up_due`
- `replied`
- `qualified`
- `won`
- `lost`

### Automation behavior in UI

- Every company now surfaces:
  - current stage
  - last touched date
  - next follow-up date
  - next recommended action
- Company detail and pipeline views persist follow-up scheduling (`next_follow_up_at`) and update `last_touched_at`.
- `next_recommended_action` is recomputed when stage or contact-selection context changes.

### Best-contact qualification logic

- Contacts can be marked as primary (`is_primary`) from Contacts and Company Detail views.
- Auto-select best contact uses a weighted score based on:
  - confidence score
  - professional title keywords (owner/founder/director/manager/etc.)
  - contact type (`person` > `department` > `generic inbox`)
  - verification status (`verified`/`likely` bonus)
- Best contact and qualification signals are visible in the contacts table and company workflow panels.

### What remains mocked in Milestone 4

Still mocked intentionally:

- area/company discovery providers
- website verification internals and score inputs
- website crawl/extraction internals
- AI summary + AI outreach generation internals
- autonomous outbound email sending

## Milestone 3.5: Search + Discovery behavior

### Real in Milestone 3.5

- Authentication and protected app routes
- Supabase persistence for CRM entities (`companies`, `contacts`, `discovery_runs`, `outreach_attempts`)
- Importing discovered companies into the real `companies` table
- Company detail, contacts, dashboard, and pipeline pages backed by Supabase

### Mocked in Milestone 3.5 and Milestone 5

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

### Current auth mode for testing

The app currently uses **Supabase anonymous sign-in** on `/login` for demo/testing flows.
Click **Enter Demo** to create an authenticated session before accessing protected routes.

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

## Direct CSV import (Supabase-backed CRM)

You can now upload CSV files directly in the `/companies` page using **Direct CSV Import (Supabase)**.

### CSV flow

1. Go to `/companies` after signing in.
2. In **Direct CSV Import (Supabase)** choose one type:
   - Companies
   - Contacts
   - Outreach Attempts
3. Upload a `.csv` file.
4. Review the parsed row preview in the UI.
5. Click **Import into Supabase**.
6. Review success/error banners for inserted/skipped row counts.

### Exact required headers

The uploader validates these required headers before import:

- **Companies CSV required headers**
  - `external_place_id`
  - `company_name`
  - `website_status`
  - `pipeline_stage`
- **Contacts CSV required headers**
  - `company_external_place_id`
  - `full_name`
  - `contact_type`
  - `verified_status`
- **OutreachAttempts CSV required headers**
  - `company_external_place_id`
  - `contact_email`
  - `sequence_number`
  - `draft_status`
  - `status`

### Full expected headers by CSV type

#### Companies

`external_place_id,company_name,website_url,website_status,main_phone,formatted_address,city,state,zip,latitude,longitude,primary_category,pipeline_stage,notes`

#### Contacts

`company_external_place_id,full_name,professional_title,bio_snippet,email,phone,contact_type,confidence_score,source_url,source_page_title,verified_status,is_primary`

#### OutreachAttempts

`company_external_place_id,contact_email,sequence_number,channel,draft_status,subject_line,body_snapshot,drafted_at,sent_at,reply_received_at,bounce_at,status`

### Duplicate handling and row mapping

- **Companies import**
  - Maps each row directly into `companies`.
  - Uses `user_id + external_place_id` upsert conflict handling to prevent duplicates.
- **Contacts import**
  - Resolves `company_external_place_id` → `companies.id` first.
  - Rows with missing company mapping are skipped with friendly row errors.
  - Duplicate prevention checks existing `contacts` by `company_id + email` and skips those rows.
- **OutreachAttempts import**
  - Resolves company via `company_external_place_id`, then resolves contact via `contact_email` inside that company.
  - Rows with missing company/contact mapping are skipped with row-level errors.
  - Duplicate prevention checks existing `outreach_attempts` by `contact_id + sequence_number` and skips duplicates.

## Test Readiness / Smoke Test phase

Use this phase whenever M4–M6 code is merged or rebased to verify that auth, CRM persistence, discovery, website status display, contact extraction, and AI surfaces are logically connected.

### Preflight checks

Run these checks first:

```bash
npm run typecheck
npm run lint
npm run build
```

If all pass, continue with the smoke test below.

### Smoke-test checklist (exact sequence)

1. **Login**
   - Open `/login`.
   - Click **Enter Demo** to sign in anonymously with Supabase.
   - Expected: redirect to `/dashboard`.
2. **Area search**
   - Go to `/companies`.
   - Enter `60601` and radius `10`.
   - Click **Discover Companies**.
   - Expected: results table appears, or explicit empty-state message appears.
3. **Company discovery results**
   - Confirm at least one row appears with website status badge (`verified` / `likely` / `mismatch` / `missing`).
   - Expected: each row includes company, address, website, phone, and an import action.
4. **Import into CRM**
   - Click **Import** on a result row.
   - Expected: import success banner appears and the company appears in **Imported Companies (Supabase)**.
5. **Company detail page**
   - Open the imported company from **View detail** (or imported list link).
   - Expected: profile panel, discovery runs panel, contacts section, AI summary, and AI outreach draft sections all render.
6. **Contact discovery run**
   - Click **Find Contacts (mock run)** on company detail.
   - Expected: success banner appears with created contact count, and discovery runs list includes the new run.
7. **Contacts visible in UI**
   - Confirm contacts are listed in the company detail contacts section.
   - Go to `/contacts`.
   - Expected: discovered contacts are present in the global contacts table.
8. **Pipeline update**
   - Go to `/pipeline`.
   - Change the company stage and click **Update stage**.
   - Expected: success banner appears and stage is updated on pipeline cards and company detail.
9. **AI summary visible**
   - Return to `/companies/[id]`.
   - Expected: **Mock AI Company Summary** section is visible with non-empty text.
10. **Outreach draft visible**
    - On `/companies/[id]`, verify **Mock Outreach Draft** section is visible with non-empty text.

### Optional seeded fast-path for manual QA

For a predictable baseline, use seeded data before running steps 5–10:

- Go to `/companies`.
- Click **Seed smoke-test path**.
- Expected: success banner with a link to an existing seeded company detail page.
- Seed is idempotent and creates/reuses:
  - one imported company
  - one contact
  - one discovery run
  - one outreach attempt

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
