import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { companies as mockCompanies } from "@/lib/mock-data/companies";
import { Company, PipelineStage } from "@/lib/types";

async function getCurrentUserId() {
  const user = await getServerUser();

  if (!user?.id) {
    throw new Error("You must be signed in to continue.");
  }

  return user.id;
}

export async function getImportedCompanies(): Promise<Company[]> {
  return supabaseRestRequest<Company[]>("companies", {
    query: { select: "*", order: "created_at.desc" },
  });
}

export async function getImportedCompanyMapByExternalId() {
  const importedCompanies = await getImportedCompanies();
  return new Map(importedCompanies.map((company) => [company.external_place_id, company]));
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const rows = await supabaseRestRequest<Company[]>("companies", {
    query: { select: "*", id: `eq.${companyId}`, limit: "1" },
  });

  return rows[0] ?? null;
}

export function searchCompaniesByLocation(query: string): Company[] {
  if (!query.trim()) {
    return mockCompanies;
  }

  const lowerQuery = query.toLowerCase();

  return mockCompanies.filter((company) => {
    return (
      company.company_name.toLowerCase().includes(lowerQuery) ||
      company.city.toLowerCase().includes(lowerQuery) ||
      company.state.toLowerCase().includes(lowerQuery) ||
      company.zip.toLowerCase().includes(lowerQuery)
    );
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

  return rows[0];
}

export async function updateCompanyDetails(
  companyId: string,
  updates: { notes: string; pipeline_stage: PipelineStage },
): Promise<Company> {
  const rows = await supabaseRestRequest<Company[]>("companies", {
    method: "PATCH",
    query: { select: "*", id: `eq.${companyId}` },
    body: {
      notes: updates.notes,
      pipeline_stage: updates.pipeline_stage,
      updated_at: new Date().toISOString(),
    },
  });

  if (!rows[0]) {
    throw new Error("Unable to update company.");
  }

  return rows[0];
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
