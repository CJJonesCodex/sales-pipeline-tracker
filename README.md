# Sales Pipeline Tracker (V1 Scaffold)

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

## Mock-only behavior in V1

This scaffold intentionally uses local mock data and does **not** integrate with external APIs yet.

Still mocked:
- authentication
- business listing search APIs
- official website verification APIs
- live web crawling/extraction
- AI model calls
- outbound email sending
- persistent database writes

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 3) Type-check and lint

```bash
npm run typecheck
npm run lint
```

### 4) Build for production

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
    mock-data/
    services/
    types.ts
```

## Notes for next milestone

- Replace mock service functions with real integrations one by one.
- Add server actions or API routes for import/discovery workflows.
- Add a real database/auth provider after core UX is validated.
