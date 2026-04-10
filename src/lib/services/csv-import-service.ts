import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import {
  CsvImportType,
  normalizeCompanyRow,
  normalizeContactRow,
  normalizeOutreachAttemptRow,
  parseCsvText,
  validateCsvHeaders,
} from "@/lib/csv-import";
import { Company, Contact, OutreachAttempt } from "@/lib/types";

export type CsvImportResult = {
  inserted: number;
  skipped: number;
  errors: string[];
};

async function getCurrentUserId() {
  const user = await getServerUser();

  if (!user?.id) {
    throw new Error("You must be signed in to import CSV files.");
  }

  return user.id;
}

function getRowError(index: number, message: string) {
  return `Row ${index + 2}: ${message}`;
}

async function importCompanies(rows: Record<string, string>[], userId: string): Promise<CsvImportResult> {
  const payload = rows
    .map(normalizeCompanyRow)
    .filter((row) => row.external_place_id && row.company_name)
    .map((row) => ({
      user_id: userId,
      ...row,
      last_touched_at: new Date().toISOString(),
      next_follow_up_at: null,
      primary_draft: "",
      outreach_draft_status: "not_started" as const,
      outreach_send_status: "not_contacted" as const,
      first_contacted_at: null,
      follow_up_due_at: null,
      stop_reason: null,
      next_recommended_action: "Review company and find best contact",
    }));

  if (!payload.length) {
    return { inserted: 0, skipped: rows.length, errors: ["No valid company rows were found."] };
  }

  const importedRows = await supabaseRestRequest<Company[]>("companies", {
    method: "POST",
    query: { select: "id", on_conflict: "user_id,external_place_id" },
    prefer: "resolution=merge-duplicates,return=representation",
    body: payload,
  });

  return {
    inserted: importedRows.length,
    skipped: Math.max(rows.length - importedRows.length, 0),
    errors: [],
  };
}

async function importContacts(rows: Record<string, string>[], userId: string): Promise<CsvImportResult> {
  const externalPlaceIds = Array.from(new Set(rows.map((row) => row.company_external_place_id).filter(Boolean)));

  const companies = externalPlaceIds.length
    ? await supabaseRestRequest<Pick<Company, "id" | "external_place_id">[]>("companies", {
        query: {
          select: "id,external_place_id",
          external_place_id: `in.(${externalPlaceIds.join(",")})`,
        },
      })
    : [];

  const companyByExternalId = new Map(companies.map((company) => [company.external_place_id, company.id]));
  const candidateRows = rows.map(normalizeContactRow);
  const existingContacts = await supabaseRestRequest<Pick<Contact, "company_id" | "email">[]>("contacts", {
    query: { select: "company_id,email" },
  });
  const existingContactKeys = new Set(existingContacts.map((contact) => `${contact.company_id}:${contact.email.toLowerCase()}`));

  const errors: string[] = [];
  let skipped = 0;

  const payload = candidateRows.flatMap((row, index) => {
    const companyId = companyByExternalId.get(row.company_external_place_id);

    if (!companyId) {
      errors.push(getRowError(index, `Company not found for external_place_id '${row.company_external_place_id}'.`));
      skipped += 1;
      return [];
    }

    const contactKey = `${companyId}:${row.email.toLowerCase()}`;
    if (row.email && existingContactKeys.has(contactKey)) {
      skipped += 1;
      return [];
    }

    if (row.email) {
      existingContactKeys.add(contactKey);
    }

    return [
      {
        user_id: userId,
        company_id: companyId,
        full_name: row.full_name,
        professional_title: row.professional_title,
        bio_snippet: row.bio_snippet,
        email: row.email,
        phone: row.phone,
        contact_type: row.contact_type,
        confidence_score: row.confidence_score,
        source_url: row.source_url,
        source_page_title: row.source_page_title,
        verified_status: row.verified_status,
        is_primary: row.is_primary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  if (!payload.length) {
    return { inserted: 0, skipped: rows.length, errors: errors.length ? errors : ["No valid contact rows were found."] };
  }

  const insertedRows = await supabaseRestRequest<Contact[]>("contacts", {
    method: "POST",
    query: { select: "id" },
    body: payload,
  });

  return {
    inserted: insertedRows.length,
    skipped,
    errors,
  };
}

async function importOutreachAttempts(rows: Record<string, string>[], userId: string): Promise<CsvImportResult> {
  const candidateRows = rows.map(normalizeOutreachAttemptRow);

  const companies = await supabaseRestRequest<Pick<Company, "id" | "external_place_id">[]>("companies", {
    query: { select: "id,external_place_id" },
  });
  const companyByExternalId = new Map(companies.map((company) => [company.external_place_id, company.id]));

  const contacts = await supabaseRestRequest<Pick<Contact, "id" | "company_id" | "email">[]>("contacts", {
    query: { select: "id,company_id,email" },
  });
  const contactsByCompanyAndEmail = new Map(
    contacts.map((contact) => [`${contact.company_id}:${contact.email.toLowerCase()}`, contact.id]),
  );

  const existingAttempts = await supabaseRestRequest<Pick<OutreachAttempt, "contact_id" | "sequence_number">[]>(
    "outreach_attempts",
    { query: { select: "contact_id,sequence_number" } },
  );
  const existingAttemptKeys = new Set(
    existingAttempts.map((attempt) => `${attempt.contact_id}:${attempt.sequence_number}`),
  );

  const errors: string[] = [];
  let skipped = 0;

  const payload = candidateRows.flatMap((row, index) => {
    const companyId = companyByExternalId.get(row.company_external_place_id);

    if (!companyId) {
      errors.push(getRowError(index, `Company not found for external_place_id '${row.company_external_place_id}'.`));
      skipped += 1;
      return [];
    }

    const contactId = contactsByCompanyAndEmail.get(`${companyId}:${row.contact_email.toLowerCase()}`);
    if (!contactId) {
      errors.push(getRowError(index, `Contact not found for email '${row.contact_email}'.`));
      skipped += 1;
      return [];
    }

    const attemptKey = `${contactId}:${row.sequence_number}`;
    if (existingAttemptKeys.has(attemptKey)) {
      skipped += 1;
      return [];
    }

    existingAttemptKeys.add(attemptKey);

    return [
      {
        user_id: userId,
        contact_id: contactId,
        sequence_number: row.sequence_number,
        channel: row.channel,
        draft_status: row.draft_status,
        subject_line: row.subject_line,
        body_snapshot: row.body_snapshot,
        drafted_at: row.drafted_at,
        sent_at: row.sent_at,
        reply_received_at: row.reply_received_at,
        bounce_at: row.bounce_at,
        status: row.status,
      },
    ];
  });

  if (!payload.length) {
    return {
      inserted: 0,
      skipped: rows.length,
      errors: errors.length ? errors : ["No valid outreach rows were found."],
    };
  }

  const insertedRows = await supabaseRestRequest<OutreachAttempt[]>("outreach_attempts", {
    method: "POST",
    query: { select: "id" },
    body: payload,
  });

  return {
    inserted: insertedRows.length,
    skipped,
    errors,
  };
}

export async function importCsvIntoSupabase(csvType: CsvImportType, csvText: string) {
  const userId = await getCurrentUserId();
  const parsed = parseCsvText(csvText);

  if (!parsed.headers.length) {
    throw new Error("CSV file is empty. Add headers and at least one row.");
  }

  if (!parsed.rows.length) {
    throw new Error("CSV has headers but no data rows.");
  }

  const headerValidation = validateCsvHeaders(csvType, parsed.headers);
  if (!headerValidation.isValid) {
    throw new Error(`Missing required headers: ${headerValidation.missingHeaders.join(", ")}`);
  }

  if (csvType === "companies") {
    return importCompanies(parsed.rows, userId);
  }

  if (csvType === "contacts") {
    return importContacts(parsed.rows, userId);
  }

  return importOutreachAttempts(parsed.rows, userId);
}
