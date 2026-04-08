# Sales Pipeline Tracker v1 Spec

## Product Goal
Build a web app that lets a user enter a zip code or address, find companies in that area, verify each company’s official website, crawl public website pages for contact information, and save the results into a CRM-style pipeline.

## Core User Flow
1. User enters a zip code or address.
2. User selects a search radius.
3. App finds companies in that area from a business listing source.
4. App shows a preview list of companies.
5. User imports selected companies into the CRM.
6. App verifies the likely official website for each company.
7. User clicks "Find Contacts" for a company.
8. App crawls public pages on that website.
9. App extracts contact data and stores it in the CRM.
10. User reviews the company, contact, and outreach data.

## V1 Scope
The first version should support:
- authentication
- dashboard
- company search/import page
- company detail page
- contacts table
- pipeline board
- discovery run history
- AI company summary
- AI outreach draft generation
- mock data support for unfinished integrations

## Required Company Fields
- company name
- formatted address
- city
- state
- zip code
- website URL
- website verification status
- main phone number
- primary category
- pipeline stage
- notes

## Required Contact Fields
- full name
- professional title
- bio/about snippet
- email
- phone number
- contact type
- confidence score
- source URL
- source page title
- verification status

## Required Outreach Fields
- email sent history
- draft status
- subject line
- body snapshot
- sent date
- reply status

## V1 Database Entities
### Companies
- id
- external_place_id
- company_name
- website_url
- website_status
- main_phone
- formatted_address
- city
- state
- zip
- latitude
- longitude
- primary_category
- pipeline_stage
- notes
- created_at
- updated_at

### Contacts
- id
- company_id
- full_name
- professional_title
- bio_snippet
- email
- phone
- contact_type
- confidence_score
- source_url
- source_page_title
- verified_status
- created_at
- updated_at

### DiscoveryRuns
- id
- company_id
- started_at
- finished_at
- status
- pages_scanned
- emails_found
- phones_found
- contacts_found
- error_log

### OutreachAttempts
- id
- contact_id
- sequence_number
- channel
- draft_status
- subject_line
- body_snapshot
- drafted_at
- sent_at
- reply_received_at
- bounce_at
- status

## Website Verification Rules
A company website should be scored using:
1. business listing match
2. company name match on website
3. address or phone match on website

Possible statuses:
- verified
- likely
- mismatch
- missing

## Crawl Rules
For v1, only crawl public business-facing pages such as:
- homepage
- /contact
- /about
- /team
- /staff
- /leadership
- /company

The crawler should extract:
- visible emails
- mailto links
- visible phone numbers
- tel links
- names
- professional titles
- short bio snippets
- contact page links

Each extracted field must store its source URL.

## AI Responsibilities
AI should be used for:
- summarizing the company
- classifying whether a contact is a real person, department, or generic inbox
- identifying likely target contacts
- generating outreach drafts

AI should not be the primary extraction method for raw emails or phone numbers when deterministic extraction is possible.

## Non-Goals for V1
Do not build these yet:
- fully autonomous email sending
- LinkedIn scraping
- social media scraping
- scraping private pages
- guaranteed complete coverage of every business in a zip code
- advanced email sequencing
- mobile native iOS app

## Suggested Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- Supabase for database/auth
- background job system for crawl runs
- Playwright + HTML parsing for crawling
- OpenAI for summaries/classification/draft generation

## First Build Milestone
Build a working web app with:
- login screen
- dashboard shell
- company search UI
- imported company list
- company detail page
- contacts table
- pipeline stage UI
- mock discovery results
- mock AI summary
- mock outreach draft generation

Do not block the first milestone on external API integrations.
Use mock data wherever needed to get the core product working first.
