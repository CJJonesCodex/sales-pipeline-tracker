import { Contact, DiscoveryRun, PipelineStage } from "@/lib/types";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { getServerUser } from "@/lib/supabase/auth-helpers";
import { getBestContact, getNextRecommendedAction } from "@/lib/pipeline";

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

export async function markPrimaryContact(companyId: string, contactId: string) {
  await supabaseRestRequest("contacts", {
    method: "PATCH",
    query: { company_id: `eq.${companyId}` },
    body: { is_primary: false, updated_at: new Date().toISOString() },
  });

  const rows = await supabaseRestRequest<Contact[]>("contacts", {
    method: "PATCH",
    query: { select: "*", id: `eq.${contactId}`, company_id: `eq.${companyId}` },
    body: { is_primary: true, updated_at: new Date().toISOString() },
  });

  if (!rows[0]) {
    throw new Error("Unable to set primary contact.");
  }

  const companyRows = await supabaseRestRequest<{ pipeline_stage: string; next_follow_up_at: string | null }[]>("companies", {
    query: { select: "pipeline_stage,next_follow_up_at", id: `eq.${companyId}`, limit: "1" },
  });

  if (companyRows[0]) {
    await supabaseRestRequest("companies", {
      method: "PATCH",
      query: { id: `eq.${companyId}` },
      body: {
        next_recommended_action: getNextRecommendedAction({
          stage: companyRows[0].pipeline_stage as PipelineStage,
          hasContacts: true,
          hasPrimaryContact: true,
          followUpDueAt: companyRows[0].next_follow_up_at,
        }),
        last_touched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  return rows[0];
}

export async function autoSelectBestContact(companyId: string) {
  const contacts = await getContactsByCompanyId(companyId);
  const bestContact = getBestContact(contacts);

  if (!bestContact) {
    return null;
  }

  return markPrimaryContact(companyId, bestContact.id);
}

export async function getDiscoveryRunsByCompanyId(companyId: string): Promise<DiscoveryRun[]> {
  return supabaseRestRequest<DiscoveryRun[]>("discovery_runs", {
    query: { select: "*", company_id: `eq.${companyId}`, order: "started_at.desc" },
  });
}

export async function runMockContactDiscovery(companyId: string): Promise<{ contactsCreated: number }> {
  const userId = await getCurrentUserId();
  const startedAt = new Date();
  const finishedAt = new Date(startedAt.getTime() + 45_000);

  const existingContacts = await getContactsByCompanyId(companyId);
  const existingEmails = new Set(existingContacts.map((contact) => contact.email.toLowerCase()));

  const mockContactCandidates = [
    {
      full_name: "Taylor Morgan",
      professional_title: "Operations Manager",
      bio_snippet: "Handles day-to-day operations and vendor coordination.",
      email: `ops+${companyId.slice(0, 8)}@example.com`,
      phone: "(312) 555-0201",
      contact_type: "person" as const,
      confidence_score: 0.89,
      source_url: "https://www.example.com/team",
      source_page_title: "Team",
      verified_status: "likely" as const,
      is_primary: false,
    },
    {
      full_name: "Front Desk",
      professional_title: "General Inquiries",
      bio_snippet: "Primary contact point for appointments and sales inquiries.",
      email: `info+${companyId.slice(0, 8)}@example.com`,
      phone: "(312) 555-0202",
      contact_type: "department" as const,
      confidence_score: 0.8,
      source_url: "https://www.example.com/contact",
      source_page_title: "Contact",
      verified_status: "unverified" as const,
      is_primary: false,
    },
  ];

  const contactsToInsert = mockContactCandidates
    .filter((candidate) => !existingEmails.has(candidate.email.toLowerCase()))
    .map((candidate) => ({
      user_id: userId,
      company_id: companyId,
      ...candidate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  if (contactsToInsert.length) {
    await supabaseRestRequest<Contact[]>("contacts", {
      method: "POST",
      query: { select: "*" },
      body: contactsToInsert,
    });
  }

  await supabaseRestRequest<DiscoveryRun[]>("discovery_runs", {
    method: "POST",
    query: { select: "*" },
    body: {
      user_id: userId,
      company_id: companyId,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      status: "completed",
      pages_scanned: 5,
      emails_found: 2,
      phones_found: 2,
      contacts_found: contactsToInsert.length,
      error_log: "",
    },
  });

  await autoSelectBestContact(companyId);

  return { contactsCreated: contactsToInsert.length };
}
