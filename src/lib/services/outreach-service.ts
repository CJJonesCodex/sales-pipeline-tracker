import { createClient } from "@/lib/supabase/server";
import { Company, Contact, OutreachAttempt } from "@/lib/types";

export async function getOutreachByContactId(contactId: string): Promise<OutreachAttempt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outreach_attempts")
    .select("*")
    .eq("contact_id", contactId)
    .order("sequence_number", { ascending: true });

  if (error) {
    return [];
  }

  return data;
}

export function generateMockCompanySummary(company: Company): string {
  return `${company.company_name} is a ${company.primary_category.toLowerCase()} in ${company.city}. Current stage is ${company.pipeline_stage}. Priority note: ${company.notes}`;
}

export function generateMockOutreachDraft(company: Company, contact: Contact | undefined): string {
  const contactName = contact?.full_name ?? "team";
  return `Hi ${contactName},\n\nI came across ${company.company_name} and wanted to share a quick idea to improve inbound lead handling for ${company.primary_category.toLowerCase()} teams. If helpful, I can send a short walkthrough tailored to your current workflow.\n\nBest,\nYour Name`;
}
