import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { companies as mockCompanies } from "@/lib/mock-data/companies";
import { contacts as mockContacts } from "@/lib/mock-data/contacts";
import { discoveryRuns as mockDiscoveryRuns } from "@/lib/mock-data/discovery-runs";
import { outreachAttempts as mockOutreachAttempts } from "@/lib/mock-data/outreach-attempts";
import { getNextRecommendedAction } from "@/lib/pipeline";
import { Company, PipelineStage } from "@/lib/types";

async function getCurrentUserId() {
  const user = await getServerUser();

  if (!user?.id) {
    throw new Error("You must be signed in to continue.");
  }

  return user.id;
}

function normalizePipelineStage(stage: string): PipelineStage {
  const stageMap: Record<string, PipelineStage> = {
    Lead: "new",
    Qualified: "qualified",
    Contacted: "contacted",
    Proposal: "draft_ready",
    Won: "won",
    Lost: "lost",
  };

  if (stage in stageMap) {
    return stageMap[stage];
  }

  return stage as PipelineStage;
}

export async function getImportedCompanies(): Promise<Company[]> {
  const companies = await supabaseRestRequest<Company[]>("companies", {
    query: { select: "*", order: "created_at.desc" },
  });

  return companies.map((company) => ({
    ...company,
    pipeline_stage: normalizePipelineStage(company.pipeline_stage),
  }));
}

export async function getImportedCompanyMapByExternalId() {
  const importedCompanies = await getImportedCompanies();
  return new Map(importedCompanies.map((company) => [company.external_place_id, company]));
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const rows = await supabaseRestRequest<Company[]>("companies", {
    query: { select: "*", id: `eq.${companyId}`, limit: "1" },
  });

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    pipeline_stage: normalizePipelineStage(rows[0].pipeline_stage),
  };
}

const mockAreaCenters: Record<string, { latitude: number; longitude: number }> = {
  "60601": { latitude: 41.8864, longitude: -87.6186 },
  chicago: { latitude: 41.8781, longitude: -87.6298 },
  "60201": { latitude: 42.0451, longitude: -87.6877 },
  evanston: { latitude: 42.0451, longitude: -87.6877 },
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMiles(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(end.latitude - start.latitude);
  const dLng = toRadians(end.longitude - start.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(start.latitude)) *
      Math.cos(toRadians(end.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function getMockAreaCenter(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  for (const [key, center] of Object.entries(mockAreaCenters)) {
    if (normalizedQuery.includes(key)) {
      return center;
    }
  }

  const directMatch = mockCompanies.find((company) => {
    const searchableText = `${company.formatted_address} ${company.city} ${company.state} ${company.zip}`.toLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  if (directMatch) {
    return {
      latitude: directMatch.latitude,
      longitude: directMatch.longitude,
    };
  }

  return null;
}

export function discoverCompaniesByArea(input: { locationQuery: string; radiusMiles: number }) {
  const locationQuery = input.locationQuery.trim();

  if (!locationQuery) {
    throw new Error("Enter a zip code or address to run discovery.");
  }

  if (!Number.isFinite(input.radiusMiles) || input.radiusMiles <= 0) {
    throw new Error("Search radius must be greater than 0 miles.");
  }

  const center = getMockAreaCenter(locationQuery);

  if (!center) {
    return [];
  }

  return mockCompanies.filter((company) => {
    const distance = getDistanceMiles(center, {
      latitude: company.latitude,
      longitude: company.longitude,
    });

    return distance <= input.radiusMiles;
  });
}

export async function importMockCompany(companyId: string): Promise<Company> {
  const userId = await getCurrentUserId();
  const selectedCompany = mockCompanies.find((company) => company.id === companyId);

  if (!selectedCompany) {
    throw new Error("Selected mock company was not found.");
  }

  const payload = {
    user_id: userId,
    external_place_id: selectedCompany.external_place_id,
    company_name: selectedCompany.company_name,
    website_url: selectedCompany.website_url,
    website_status: selectedCompany.website_status,
    main_phone: selectedCompany.main_phone,
    formatted_address: selectedCompany.formatted_address,
    city: selectedCompany.city,
    state: selectedCompany.state,
    zip: selectedCompany.zip,
    latitude: selectedCompany.latitude,
    longitude: selectedCompany.longitude,
    primary_category: selectedCompany.primary_category,
    pipeline_stage: selectedCompany.pipeline_stage,
    notes: selectedCompany.notes,
    last_touched_at: new Date().toISOString(),
    next_follow_up_at: selectedCompany.next_follow_up_at,
    next_recommended_action: selectedCompany.next_recommended_action,
  };

  const rows = await supabaseRestRequest<Company[]>("companies", {
    method: "POST",
    query: {
      select: "*",
      on_conflict: "user_id,external_place_id",
    },
    prefer: "resolution=merge-duplicates,return=representation",
    body: payload,
  });

  return {
    ...rows[0],
    pipeline_stage: normalizePipelineStage(rows[0].pipeline_stage),
  };
}

export async function updateCompanyDetails(
  companyId: string,
  updates: {
    notes: string;
    pipeline_stage: PipelineStage;
    next_follow_up_at?: string | null;
    next_recommended_action?: string;
    has_contacts?: boolean;
    has_primary_contact?: boolean;
  },
): Promise<Company> {
  const computedRecommendedAction =
    updates.next_recommended_action ??
    getNextRecommendedAction({
      stage: updates.pipeline_stage,
      hasContacts: updates.has_contacts ?? true,
      hasPrimaryContact: updates.has_primary_contact ?? true,
      nextFollowUpAt: updates.next_follow_up_at ?? null,
    });

  const rows = await supabaseRestRequest<Company[]>("companies", {
    method: "PATCH",
    query: { select: "*", id: `eq.${companyId}` },
    body: {
      notes: updates.notes,
      pipeline_stage: updates.pipeline_stage,
      next_follow_up_at: updates.next_follow_up_at ?? null,
      next_recommended_action: computedRecommendedAction,
      last_touched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });

  if (!rows[0]) {
    throw new Error("Unable to update company.");
  }

  return {
    ...rows[0],
    pipeline_stage: normalizePipelineStage(rows[0].pipeline_stage),
  };
}

export function getMockWebsiteVerificationReason(company: Company): string {
  if (company.website_status === "verified") {
    return "Business listing, name match, and phone match were found.";
  }

  if (company.website_status === "likely") {
    return "Name and listing are close, but phone/address match is incomplete.";
  }

  if (company.website_status === "mismatch") {
    return "Found a site, but branding and contact details do not align.";
  }

  return "No clear official website found from mock search results.";
}

export async function seedSmokeTestData() {
  const userId = await getCurrentUserId();
  const selectedCompany = mockCompanies[0];

  const companyRows = await supabaseRestRequest<Company[]>("companies", {
    method: "POST",
    query: {
      select: "*",
      on_conflict: "user_id,external_place_id",
    },
    prefer: "resolution=merge-duplicates,return=representation",
    body: {
      user_id: userId,
      external_place_id: selectedCompany.external_place_id,
      company_name: selectedCompany.company_name,
      website_url: selectedCompany.website_url,
      website_status: selectedCompany.website_status,
      main_phone: selectedCompany.main_phone,
      formatted_address: selectedCompany.formatted_address,
      city: selectedCompany.city,
      state: selectedCompany.state,
      zip: selectedCompany.zip,
      latitude: selectedCompany.latitude,
      longitude: selectedCompany.longitude,
      primary_category: selectedCompany.primary_category,
      pipeline_stage: selectedCompany.pipeline_stage,
      notes: selectedCompany.notes,
      last_touched_at: new Date().toISOString(),
      next_follow_up_at: selectedCompany.next_follow_up_at,
      next_recommended_action: selectedCompany.next_recommended_action,
    },
  });

  const company = companyRows[0];
  const seededContactTemplate = mockContacts.find((contact) => contact.company_id === selectedCompany.id);
  const nowIso = new Date().toISOString();

  if (seededContactTemplate) {
    const existingContacts = await supabaseRestRequest<{ id: string; email: string }[]>("contacts", {
      query: {
        select: "id,email",
        company_id: `eq.${company.id}`,
      },
    });

    if (!existingContacts.some((contact) => contact.email.toLowerCase() === seededContactTemplate.email.toLowerCase())) {
      await supabaseRestRequest("contacts", {
        method: "POST",
        query: { select: "id" },
        body: {
          user_id: userId,
          company_id: company.id,
          full_name: seededContactTemplate.full_name,
          professional_title: seededContactTemplate.professional_title,
          bio_snippet: seededContactTemplate.bio_snippet,
          email: seededContactTemplate.email,
          phone: seededContactTemplate.phone,
          contact_type: seededContactTemplate.contact_type,
          confidence_score: seededContactTemplate.confidence_score,
          source_url: seededContactTemplate.source_url,
          source_page_title: seededContactTemplate.source_page_title,
          verified_status: seededContactTemplate.verified_status,
          is_primary: true,
          created_at: nowIso,
          updated_at: nowIso,
        },
      });
    }
  }

  const existingRuns = await supabaseRestRequest<{ id: string }[]>("discovery_runs", {
    query: {
      select: "id",
      company_id: `eq.${company.id}`,
      order: "started_at.desc",
      limit: "1",
    },
  });

  if (!existingRuns.length) {
    const runTemplate = mockDiscoveryRuns[0];
    await supabaseRestRequest("discovery_runs", {
      method: "POST",
      query: { select: "id" },
      body: {
        user_id: userId,
        company_id: company.id,
        started_at: runTemplate.started_at,
        finished_at: runTemplate.finished_at,
        status: runTemplate.status,
        pages_scanned: runTemplate.pages_scanned,
        emails_found: runTemplate.emails_found,
        phones_found: runTemplate.phones_found,
        contacts_found: runTemplate.contacts_found,
        error_log: runTemplate.error_log,
      },
    });
  }

  const contactRows = await supabaseRestRequest<{ id: string }[]>("contacts", {
    query: {
      select: "id",
      company_id: `eq.${company.id}`,
      order: "created_at.asc",
      limit: "1",
    },
  });

  if (contactRows[0]) {
    const existingAttempts = await supabaseRestRequest<{ id: string }[]>("outreach_attempts", {
      query: {
        select: "id",
        contact_id: `eq.${contactRows[0].id}`,
        limit: "1",
      },
    });

    if (!existingAttempts.length) {
      const attemptTemplate = mockOutreachAttempts[0];
      await supabaseRestRequest("outreach_attempts", {
        method: "POST",
        query: { select: "id" },
        body: {
          user_id: userId,
          contact_id: contactRows[0].id,
          sequence_number: attemptTemplate.sequence_number,
          channel: attemptTemplate.channel,
          draft_status: attemptTemplate.draft_status,
          subject_line: attemptTemplate.subject_line,
          body_snapshot: attemptTemplate.body_snapshot,
          drafted_at: attemptTemplate.drafted_at,
          sent_at: attemptTemplate.sent_at,
          reply_received_at: attemptTemplate.reply_received_at,
          bounce_at: attemptTemplate.bounce_at,
          status: attemptTemplate.status,
        },
      });
    }
  }

  return { companyId: company.id };
}
