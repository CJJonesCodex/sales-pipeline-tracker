import { PipelineStage, WebsiteStatus } from "@/lib/types";

export type CsvImportType = "companies" | "contacts" | "outreach_attempts";

export const csvRequiredHeaders: Record<CsvImportType, string[]> = {
  companies: [
    "external_place_id",
    "company_name",
    "website_status",
    "pipeline_stage",
  ],
  contacts: [
    "company_external_place_id",
    "full_name",
    "contact_type",
    "verified_status",
  ],
  outreach_attempts: [
    "company_external_place_id",
    "contact_email",
    "sequence_number",
    "draft_status",
    "status",
  ],
};

export const csvExampleHeaders: Record<CsvImportType, string[]> = {
  companies: [
    "external_place_id",
    "company_name",
    "website_url",
    "website_status",
    "main_phone",
    "formatted_address",
    "city",
    "state",
    "zip",
    "latitude",
    "longitude",
    "primary_category",
    "pipeline_stage",
    "notes",
  ],
  contacts: [
    "company_external_place_id",
    "full_name",
    "professional_title",
    "bio_snippet",
    "email",
    "phone",
    "contact_type",
    "confidence_score",
    "source_url",
    "source_page_title",
    "verified_status",
    "is_primary",
  ],
  outreach_attempts: [
    "company_external_place_id",
    "contact_email",
    "sequence_number",
    "channel",
    "draft_status",
    "subject_line",
    "body_snapshot",
    "drafted_at",
    "sent_at",
    "reply_received_at",
    "bounce_at",
    "status",
  ],
};

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalizedText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (!normalizedText) {
    return { headers: [], rows: [] };
  }

  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });

    return row;
  });

  return { headers, rows };
}

export function validateCsvHeaders(csvType: CsvImportType, headers: string[]) {
  const requiredHeaders = csvRequiredHeaders[csvType];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  return {
    missingHeaders,
    isValid: missingHeaders.length === 0,
  };
}

const validWebsiteStatuses: WebsiteStatus[] = ["verified", "likely", "mismatch", "missing"];
const validPipelineStages: PipelineStage[] = [
  "new",
  "website_verified",
  "contacts_found",
  "best_contact_selected",
  "draft_ready",
  "contacted",
  "follow_up_due",
  "replied",
  "qualified",
  "won",
  "lost",
];
const validContactTypes = ["person", "department", "generic inbox"] as const;
const validVerifiedStatuses = ["verified", "likely", "unverified"] as const;
const validDraftStatuses = ["drafted", "ready", "sent"] as const;
const validAttemptStatuses = ["not_sent", "sent", "replied", "bounced"] as const;

function getSafeDate(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? fallback : parsedDate.toISOString();
}

export function normalizeCompanyRow(row: Record<string, string>) {
  const websiteStatus = row.website_status as WebsiteStatus;
  const pipelineStage = row.pipeline_stage as PipelineStage;

  return {
    external_place_id: row.external_place_id,
    company_name: row.company_name,
    website_url: row.website_url || "",
    website_status: validWebsiteStatuses.includes(websiteStatus) ? websiteStatus : "missing",
    main_phone: row.main_phone || "",
    formatted_address: row.formatted_address || "",
    city: row.city || "",
    state: row.state || "",
    zip: row.zip || "",
    latitude: Number(row.latitude || "0") || 0,
    longitude: Number(row.longitude || "0") || 0,
    primary_category: row.primary_category || "",
    pipeline_stage: validPipelineStages.includes(pipelineStage) ? pipelineStage : "new",
    notes: row.notes || "",
  };
}

export function normalizeContactRow(row: Record<string, string>) {
  const contactType = row.contact_type as (typeof validContactTypes)[number];
  const verifiedStatus = row.verified_status as (typeof validVerifiedStatuses)[number];

  return {
    company_external_place_id: row.company_external_place_id,
    full_name: row.full_name,
    professional_title: row.professional_title || "",
    bio_snippet: row.bio_snippet || "",
    email: row.email || "",
    phone: row.phone || "",
    contact_type: validContactTypes.includes(contactType) ? contactType : "person",
    confidence_score: Number(row.confidence_score || "0") || 0,
    source_url: row.source_url || "",
    source_page_title: row.source_page_title || "",
    verified_status: validVerifiedStatuses.includes(verifiedStatus) ? verifiedStatus : "unverified",
    is_primary: row.is_primary?.toLowerCase() === "true",
  };
}

export function normalizeOutreachAttemptRow(row: Record<string, string>) {
  const draftStatus = row.draft_status as (typeof validDraftStatuses)[number];
  const status = row.status as (typeof validAttemptStatuses)[number];
  const nowIso = new Date().toISOString();

  return {
    company_external_place_id: row.company_external_place_id,
    contact_email: row.contact_email,
    sequence_number: Number(row.sequence_number || "1") || 1,
    channel: "email" as const,
    draft_status: validDraftStatuses.includes(draftStatus) ? draftStatus : "drafted",
    subject_line: row.subject_line || "",
    body_snapshot: row.body_snapshot || "",
    drafted_at: getSafeDate(row.drafted_at || "", nowIso),
    sent_at: row.sent_at ? getSafeDate(row.sent_at, nowIso) : null,
    reply_received_at: row.reply_received_at ? getSafeDate(row.reply_received_at, nowIso) : null,
    bounce_at: row.bounce_at ? getSafeDate(row.bounce_at, nowIso) : null,
    status: validAttemptStatuses.includes(status) ? status : "not_sent",
  };
}
