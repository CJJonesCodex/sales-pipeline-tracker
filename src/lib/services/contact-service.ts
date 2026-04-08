import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { Contact, DiscoveryRun, ExtractedContactCandidate } from "@/lib/types";
import { getCompanyById } from "@/lib/services/company-service";

async function getCurrentUserId() {
  const user = await getServerUser();

  if (!user?.id) {
    throw new Error("You must be signed in to continue.");
  }

  return user.id;
}

export async function getAllContacts(): Promise<Contact[]> {
  return supabaseRestRequest<Contact[]>("contacts", {
    query: { select: "*", order: "created_at.desc" },
  });
}

export async function getContactsByCompanyId(companyId: string): Promise<Contact[]> {
  return supabaseRestRequest<Contact[]>("contacts", {
    query: { select: "*", company_id: `eq.${companyId}`, order: "created_at.desc" },
  });
}

export async function updateContact(
  contactId: string,
  updates: Pick<Contact, "professional_title" | "email" | "phone" | "verified_status">,
): Promise<Contact> {
  const rows = await supabaseRestRequest<Contact[]>("contacts", {
    method: "PATCH",
    query: { select: "*", id: `eq.${contactId}` },
    body: {
      ...updates,
      updated_at: new Date().toISOString(),
    },
  });

  if (!rows[0]) {
    throw new Error("Unable to update contact.");
  }

  return rows[0];
}

export async function getDiscoveryRunsByCompanyId(companyId: string): Promise<DiscoveryRun[]> {
  return supabaseRestRequest<DiscoveryRun[]>("discovery_runs", {
    query: { select: "*", company_id: `eq.${companyId}`, order: "started_at.desc" },
  });
}

function toAbsoluteUrl(baseUrl: string, path: string) {
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return "";
  }
}

function getPublicCrawlUrls(websiteUrl: string) {
  const paths = ["/", "/contact", "/about", "/team", "/staff", "/leadership", "/company"];
  return paths.map((path) => toAbsoluteUrl(websiteUrl, path)).filter(Boolean);
}

function stripHtml(html: string) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmails(text: string) {
  return Array.from(new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []));
}

function extractPhones(text: string) {
  return Array.from(new Set(text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [])).map((phone) => phone.trim());
}

function extractContactsFromText(text: string, sourceUrl: string, sourceTitle: string): ExtractedContactCandidate[] {
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const lines = text.split(/\.|\n/).map((line) => line.trim()).filter(Boolean);

  const titleKeywords = ["CEO", "Founder", "Owner", "Director", "Manager", "President", "Partner"];
  const possiblePeople = lines
    .filter((line) => /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(line))
    .slice(0, 6);

  const contacts: ExtractedContactCandidate[] = [];

  emails.forEach((email, index) => {
    const matchingLine = possiblePeople[index] ?? possiblePeople[0] ?? "";
    const nameMatch = matchingLine.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
    const title = titleKeywords.find((keyword) => matchingLine.includes(keyword)) ?? "";

    contacts.push({
      full_name: nameMatch?.[1] ?? (email.includes("info@") ? "General Inbox" : "Website Contact"),
      professional_title: title,
      bio_snippet: matchingLine.slice(0, 180),
      email,
      phone: phones[0] ?? "",
      contact_type: nameMatch ? "person" : "generic inbox",
      confidence_score: nameMatch ? 0.82 : 0.62,
      source_url: sourceUrl,
      source_page_title: sourceTitle,
      verified_status: nameMatch ? "likely" : "unverified",
      review_status: "needs_review",
    });
  });

  if (!contacts.length && phones.length) {
    contacts.push({
      full_name: "Phone Contact",
      professional_title: "",
      bio_snippet: "Phone number found on public company page.",
      email: "",
      phone: phones[0],
      contact_type: "department",
      confidence_score: 0.45,
      source_url: sourceUrl,
      source_page_title: sourceTitle,
      verified_status: "unverified",
      review_status: "needs_review",
    });
  }

  return contacts;
}

function getContactDedupKey(candidate: ExtractedContactCandidate) {
  const emailKey = candidate.email.toLowerCase();
  const nameKey = candidate.full_name.toLowerCase().replace(/\s+/g, " ").trim();
  return `${emailKey}|${nameKey}`;
}

export async function runCompanyDiscovery(companyId: string) {
  const userId = await getCurrentUserId();
  const company = await getCompanyById(companyId);

  if (!company) {
    throw new Error("Company not found.");
  }

  const startedAt = new Date();
  const crawlUrls = getPublicCrawlUrls(company.website_url);

  if (!crawlUrls.length) {
    throw new Error("Company does not have a crawlable website URL.");
  }

  const extractedCandidates: ExtractedContactCandidate[] = [];
  const scannedUrls: string[] = [];
  let errorLog = "";

  for (const url of crawlUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "sales-pipeline-tracker/1.0",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const text = stripHtml(html);
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const pageTitle = titleMatch?.[1]?.trim() ?? "Website Page";

      extractedCandidates.push(...extractContactsFromText(text, url, pageTitle));
      scannedUrls.push(url);
    } catch (error) {
      errorLog = `${errorLog}\n${url}: ${(error as Error).message}`.trim();
    }
  }

  const dedupedCandidates = Array.from(
    new Map(extractedCandidates.map((candidate) => [getContactDedupKey(candidate), candidate])).values(),
  );

  const existingContacts = await getContactsByCompanyId(companyId);
  const existingKeys = new Set(existingContacts.map((contact) => `${contact.email.toLowerCase()}|${contact.full_name.toLowerCase()}`));

  const contactsToInsert = dedupedCandidates.filter((candidate) => !existingKeys.has(getContactDedupKey(candidate)));

  if (contactsToInsert.length) {
    await supabaseRestRequest<Contact[]>("contacts", {
      method: "POST",
      query: { select: "*" },
      prefer: "return=representation",
      body: contactsToInsert.map((candidate) => ({
        user_id: userId,
        company_id: companyId,
        full_name: candidate.full_name,
        professional_title: candidate.professional_title,
        bio_snippet: candidate.bio_snippet,
        email: candidate.email,
        phone: candidate.phone,
        contact_type: candidate.contact_type,
        confidence_score: candidate.confidence_score,
        source_url: candidate.source_url,
        source_page_title: candidate.source_page_title,
        verified_status: candidate.verified_status,
        review_status: candidate.review_status,
      })),
    });
  }

  const finishedAt = new Date();

  await supabaseRestRequest<DiscoveryRun[]>("discovery_runs", {
    method: "POST",
    query: { select: "*" },
    body: {
      user_id: userId,
      company_id: companyId,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      status: errorLog ? "failed" : "completed",
      pages_scanned: scannedUrls.length,
      scanned_urls: scannedUrls,
      emails_found: dedupedCandidates.filter((candidate) => candidate.email).length,
      phones_found: dedupedCandidates.filter((candidate) => candidate.phone).length,
      contacts_found: contactsToInsert.length,
      error_log: errorLog,
    },
  });

  return {
    scannedUrls,
    contactsCreated: contactsToInsert.length,
  };
}
