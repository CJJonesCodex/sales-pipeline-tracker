import { createClient } from "@/lib/supabase/server";
import { Company } from "@/lib/types";
import { companies as mockCompanies } from "@/lib/mock-data/companies";

export async function getImportedCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getCompanyById(companyId: string): Promise<Company | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    return undefined;
  }

  return data ?? undefined;
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

export async function importMockCompany(companyId: string): Promise<void> {
  const selectedCompany = mockCompanies.find((company) => company.id === companyId);

  if (!selectedCompany) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("companies").upsert(
    {
      user_id: user.id,
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
    },
    { onConflict: "user_id,external_place_id" }
  );
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
