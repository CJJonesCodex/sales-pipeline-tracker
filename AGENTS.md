# AGENTS.md

## Project mission
Build a beginner-friendly web app called Sales Pipeline Tracker.

This app should help a user:
- search companies by zip code or address
- import companies into a CRM-style system
- verify likely official websites
- crawl public business-facing pages for contact info
- store companies, contacts, and outreach history
- use mock data for unfinished integrations first

## Build priorities
1. Start with the web app only.
2. Use mock data before real external APIs.
3. Make the code clean, modular, and beginner-readable.
4. Prefer simple architecture over clever architecture.
5. Do not block progress on Maps, email, or crawler integrations in the first pass.

## Tech expectations
- Next.js
- TypeScript
- Tailwind CSS
- Component-based structure
- Clear folder organization
- Mock data layer first
- Real integrations later

## V1 rules
- Do not implement autonomous email sending yet.
- Do not scrape private pages.
- Do not add LinkedIn scraping.
- Do not depend on external APIs to make the first version usable.
- Build the product shell first.

## UX requirements
Create these screens first:
- Login screen
- Dashboard
- Company search/import page
- Company detail page
- Contacts table
- Pipeline board

## Data model expectations
Support these entities:
- Companies
- Contacts
- DiscoveryRuns
- OutreachAttempts

## Coding style
- Keep files readable for a beginner
- Use descriptive names
- Avoid unnecessary complexity
- Add comments only when they truly help
- Prefer reusable UI components

## Definition of done for first milestone
The first milestone is complete when:
- the app runs locally
- the main routes exist
- mock company search works
- mock company import works
- company detail page works
- contacts table works
- pipeline board works
- mock AI summary and mock outreach draft are visible in UI

## Before finishing any task
- explain what was built
- explain what still uses mock data
- keep setup instructions updated in README
