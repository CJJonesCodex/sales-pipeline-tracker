import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { companies as mockCompanies } from "@/lib/mock-data/companies";
import { Company, CompanyDiscoveryResult, PipelineStage, WebsiteStatus } from "@/lib/types";

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

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getDomain(url: string) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export async function getImportedCompanyLookup() {
  const importedCompanies = await getImportedCompanies();

  const byExternalId = new Map<string, Company>(
    importedCompanies.map((company) => [company.external_place_id, company] as const),
  );
  const byWebsiteDomain = new Map<string, Company>(
    importedCompanies
      .map((company) => [getDomain(company.website_url), company] as const)
      .filter(([domain]) => domain.length > 0),
  );
  const byNameAndAddress = new Map(
    importedCompanies.map((company) => {
      const key = `${normalizeText(company.company_name)}|${normalizeText(company.formatted_address)}`;
      return [key, company] as const;
    }),
  );

  return { importedCompanies, byExternalId, byWebsiteDomain, byNameAndAddress };
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const rows = await supabaseRestRequest<Company[]>("companies", {
    query: { select: "*", id: `eq.${companyId}`, limit: "1" },
  });

  return rows[0] ?? null;
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

function splitAddress(formattedAddress: string) {
  const match = formattedAddress.match(/^(.*?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})?/);

  if (!match) {
    return { city: "", state: "", zip: "" };
  }

  return {
    city: match[2]?.trim() ?? "",
    state: match[3]?.trim() ?? "",
    zip: match[4]?.trim() ?? "",
  };
}

function scoreWebsiteStatus(input: { companyName: string; websiteUrl: string; formattedAddress: string; phone: string }): WebsiteStatus {
  if (!input.websiteUrl) {
    return "missing";
  }

  const domain = getDomain(input.websiteUrl);
  if (!domain) {
    return "mismatch";
  }

  const normalizedName = normalizeText(input.companyName);
  const nameTokens = normalizedName.split(" ").filter((token) => token.length > 2);
  const matchedNameToken = nameTokens.some((token) => domain.includes(token));

  const hasAddressSignals = /\d/.test(input.formattedAddress);
  const hasPhoneSignals = /\d/.test(input.phone);

  if (matchedNameToken && hasAddressSignals && hasPhoneSignals) {
    return "verified";
  }

  if (matchedNameToken) {
    return "likely";
  }

  return "mismatch";
}

async function geocodeLocationQuery(locationQuery: string) {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("q", locationQuery);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "sales-pipeline-tracker/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Geocoding request failed.");
  }

  const rows = (await response.json()) as Array<{ lat: string; lon: string }>;
  const topResult = rows[0];

  if (!topResult) {
    return null;
  }

  return {
    latitude: Number(topResult.lat),
    longitude: Number(topResult.lon),
  };
}

async function searchOverpassBusinesses(center: { latitude: number; longitude: number }, radiusMiles: number) {
  const radiusMeters = Math.max(250, Math.round(radiusMiles * 1609.34));
  const query = `[out:json][timeout:25];\n(\n  node[\"name\"](around:${radiusMeters},${center.latitude},${center.longitude});\n  way[\"name\"](around:${radiusMeters},${center.latitude},${center.longitude});\n  relation[\"name\"](around:${radiusMeters},${center.latitude},${center.longitude});\n);\nout center 40;`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "User-Agent": "sales-pipeline-tracker/1.0",
    },
    body: query,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Business search request failed.");
  }

  const payload = (await response.json()) as {
    elements: Array<{
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  return payload.elements ?? [];
}

function mapOverpassResultToDiscoveryResult(
  row: {
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  },
): CompanyDiscoveryResult | null {
  const tags = row.tags ?? {};
  const companyName = tags.name?.trim();
  const latitude = row.lat ?? row.center?.lat;
  const longitude = row.lon ?? row.center?.lon;

  if (!companyName || typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  const houseNumber = tags["addr:housenumber"] ?? "";
  const street = tags["addr:street"] ?? "";
  const city = tags["addr:city"] ?? "";
  const state = tags["addr:state"] ?? "";
  const zip = tags["addr:postcode"] ?? "";
  const addressLine = [houseNumber, street].filter(Boolean).join(" ");
  const formattedAddress = [addressLine, city, [state, zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const websiteUrl = tags.website ?? tags["contact:website"] ?? "";
  const mainPhone = tags.phone ?? tags["contact:phone"] ?? "";
  const primaryCategory = tags.shop ?? tags.amenity ?? tags.office ?? tags.craft ?? "Business";

  return {
    discovery_id: `osm-${row.id}`,
    provider_place_id: `osm-${row.id}`,
    company_name: companyName,
    formatted_address: formattedAddress,
    city,
    state,
    zip,
    latitude,
    longitude,
    main_phone: mainPhone,
    website_url: websiteUrl,
    primary_category: primaryCategory,
    provider_name: "osm-overpass",
    provider_metadata: {
      osm_id: row.id,
      amenity: tags.amenity ?? "",
      office: tags.office ?? "",
      shop: tags.shop ?? "",
    },
    website_status: scoreWebsiteStatus({
      companyName,
      websiteUrl,
      formattedAddress,
      phone: mainPhone,
    }),
  };
}

function discoverCompaniesFromMock(input: { locationQuery: string; radiusMiles: number }): CompanyDiscoveryResult[] {
  const center = getMockAreaCenter(input.locationQuery);

  if (!center) {
    return [];
  }

  return mockCompanies
    .filter((company) => {
      const distance = getDistanceMiles(center, {
        latitude: company.latitude,
        longitude: company.longitude,
      });

      return distance <= input.radiusMiles;
    })
    .map((company) => ({
      discovery_id: company.id,
      provider_place_id: company.external_place_id,
      company_name: company.company_name,
      formatted_address: company.formatted_address,
      city: company.city,
      state: company.state,
      zip: company.zip,
      latitude: company.latitude,
      longitude: company.longitude,
      main_phone: company.main_phone,
      website_url: company.website_url,
      primary_category: company.primary_category,
      provider_name: "mock",
      provider_metadata: company.provider_metadata,
      website_status: company.website_status,
    }));
}

export async function discoverCompaniesByArea(input: {
  locationQuery: string;
  radiusMiles: number;
}): Promise<CompanyDiscoveryResult[]> {
  const locationQuery = input.locationQuery.trim();

  if (!locationQuery) {
    throw new Error("Enter a zip code or address to run discovery.");
  }

  if (!Number.isFinite(input.radiusMiles) || input.radiusMiles <= 0) {
    throw new Error("Search radius must be greater than 0 miles.");
  }

  try {
    const center = await geocodeLocationQuery(locationQuery);
    if (!center) {
      return [];
    }

    const rows = await searchOverpassBusinesses(center, input.radiusMiles);
    const mappedRows = rows
      .map(mapOverpassResultToDiscoveryResult)
      .filter((row): row is CompanyDiscoveryResult => Boolean(row));

    if (!mappedRows.length) {
      return discoverCompaniesFromMock(input);
    }

    return mappedRows;
  } catch {
    return discoverCompaniesFromMock(input);
  }
}

function getDuplicateCompanyId(
  candidate: CompanyDiscoveryResult,
  lookup: Awaited<ReturnType<typeof getImportedCompanyLookup>>,
) {
  const byExternalId = lookup.byExternalId.get(candidate.provider_place_id);
  if (byExternalId) {
    return byExternalId.id;
  }

  const byDomain = lookup.byWebsiteDomain.get(getDomain(candidate.website_url));
  if (byDomain) {
    return byDomain.id;
  }

  const byNameAndAddress = lookup.byNameAndAddress.get(
    `${normalizeText(candidate.company_name)}|${normalizeText(candidate.formatted_address)}`,
  );

  return byNameAndAddress?.id ?? null;
}

export async function importDiscoveredCompany(company: CompanyDiscoveryResult): Promise<Company> {
  const userId = await getCurrentUserId();

  const payload = {
    user_id: userId,
    external_place_id: company.provider_place_id,
    company_name: company.company_name,
    website_url: company.website_url,
    website_status: company.website_status,
    main_phone: company.main_phone,
    formatted_address: company.formatted_address,
    city: company.city,
    state: company.state,
    zip: company.zip,
    latitude: company.latitude,
    longitude: company.longitude,
    primary_category: company.primary_category,
    pipeline_stage: "Lead",
    notes: "",
    provider_name: company.provider_name,
    provider_metadata: company.provider_metadata,
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

export function getWebsiteVerificationReason(company: Company): string {
  if (company.website_status === "verified") {
    return "Domain appears to match the business name and has matching location or phone signals.";
  }

  if (company.website_status === "likely") {
    return "Domain looks close to the company name, but full address/phone confidence is incomplete.";
  }

  if (company.website_status === "mismatch") {
    return "A website exists, but domain/name signals do not line up well with this company.";
  }

  return "No clear official website was found in provider data.";
}

export function getCityStateZipFromAddress(formattedAddress: string) {
  return splitAddress(formattedAddress);
}

export function getDuplicateIdForDiscoveryResult(
  candidate: CompanyDiscoveryResult,
  lookup: Awaited<ReturnType<typeof getImportedCompanyLookup>>,
) {
  return getDuplicateCompanyId(candidate, lookup);
}
