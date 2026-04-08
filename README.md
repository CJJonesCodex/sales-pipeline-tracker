# Sales Pipeline Tracker (Milestone 2)

Beginner-friendly web app shell for discovering local companies, importing them into a CRM-style workflow, reviewing contacts, and drafting outreach.

## What Milestone 2 adds

- Supabase Auth integration (email/password)
- Protected routes for app pages
- Supabase database persistence for:
  - Companies
  - Contacts
  - DiscoveryRuns
  - OutreachAttempts
- SQL schema + Row Level Security (RLS) policies in `supabase/schema.sql`

## Still mocked in this milestone

These remain intentionally mocked so we can keep product progress fast:

- business listing search source (search results are local mock data)
- official website verification logic source
- public-page crawling and extraction jobs
- AI company summaries
- AI outreach draft generation
- email sending

## Required environment variables

Create a `.env.local` file using `.env.example`:

```bash
cp .env.example .env.local
```

Set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Supabase setup

1. Create a Supabase project.
2. In Supabase, open the SQL Editor.
3. Run the SQL from `supabase/schema.sql`.
4. In Supabase Auth, create a test user (email/password) for login.

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Open http://localhost:3000.

### 3) Lint and typecheck

```bash
npm run lint
npm run typecheck
```

## Routes

- `/login`
- `/dashboard`
- `/companies`
- `/companies/[id]`
- `/contacts`
- `/pipeline`

## Data flow notes

- `/companies` search uses local mock dataset.
- Clicking **Import** writes that selected mock company into Supabase.
- Dashboard/pipeline/company detail/contacts read from Supabase.

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
  lib/
    auth/
    supabase/
    services/
    mock-data/
    types.ts
    database.types.ts
supabase/
  schema.sql
```
