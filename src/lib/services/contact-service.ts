import { Contact, DiscoveryRun } from "@/lib/types";
import { supabaseRestRequest } from "@/lib/supabase/rest";

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
