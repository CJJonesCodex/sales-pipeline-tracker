import { companies } from "@/lib/mock-data/companies";
import { Company } from "@/lib/types";

export function getImportedCompanies(): Company[] {
  return companies;
}

export function getCompanyById(companyId: string): Company | undefined {
  return companies.find((company) => company.id === companyId);
}

export function searchCompaniesByLocation(query: string): Company[] {
  if (!query.trim()) {
    return companies;
  }

  const lowerQuery = query.toLowerCase();

  return companies.filter((company) => {
    return (
      company.company_name.toLowerCase().includes(lowerQuery) ||
      company.city.toLowerCase().includes(lowerQuery) ||
      company.state.toLowerCase().includes(lowerQuery) ||
      company.zip.toLowerCase().includes(lowerQuery)
    );
  });
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
