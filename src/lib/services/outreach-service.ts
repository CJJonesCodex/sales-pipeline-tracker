import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { Company, Contact, OutreachAttempt } from "@/lib/types";

async function getCurrentUserId() {
  const user = await getServerUser();

  if (!user?.id) {
    throw new Error("You must be signed in to continue.");
  }

  return user.id;
}

export async function getOutreachByContactIds(contactIds: string[]): Promise<OutreachAttempt[]> {
  if (!contactIds.length) {
    return [];
  }

  return supabaseRestRequest<OutreachAttempt[]>("outreach_attempts", {
    query: {
      select: "*",
      contact_id: `in.(${contactIds.join(",")})`,
      order: "drafted_at.desc",
    },
  });
}

export async function createOutreachAttempt(input: {
  contact_id: string;
  sequence_number: number;
  subject_line: string;
  body_snapshot: string;
}): Promise<OutreachAttempt> {
  const userId = await getCurrentUserId();

  const rows = await supabaseRestRequest<OutreachAttempt[]>("outreach_attempts", {
    method: "POST",
    query: { select: "*" },
    body: {
      user_id: userId,
      contact_id: input.contact_id,
      sequence_number: input.sequence_number,
      channel: "email",
      draft_status: "drafted",
      subject_line: input.subject_line,
      body_snapshot: input.body_snapshot,
      drafted_at: new Date().toISOString(),
      sent_at: null,
      reply_received_at: null,
      bounce_at: null,
      status: "not_sent",
    },
  });

  if (!rows[0]) {
    throw new Error("Unable to create outreach attempt.");
  }

  return rows[0];
}

export async function updateOutreachAttempt(
  attemptId: string,
  updates: Pick<OutreachAttempt, "draft_status" | "subject_line" | "body_snapshot" | "status">,
): Promise<OutreachAttempt> {
  const rows = await supabaseRestRequest<OutreachAttempt[]>("outreach_attempts", {
    method: "PATCH",
    query: { select: "*", id: `eq.${attemptId}` },
    body: updates,
  });

  if (!rows[0]) {
    throw new Error("Unable to update outreach attempt.");
  }

  return rows[0];
}

export function generateMockCompanySummary(company: Company): string {
  return `${company.company_name} is a ${company.primary_category.toLowerCase()} in ${company.city}. Current stage is ${company.pipeline_stage}. Priority note: ${company.notes}`;
}

export function generateMockOutreachDraft(company: Company, contact: Contact | undefined): string {
  const contactName = contact?.full_name ?? "team";
  return `Hi ${contactName},\n\nI came across ${company.company_name} and wanted to share a quick idea to improve inbound lead handling for ${company.primary_category.toLowerCase()} teams. If helpful, I can send a short walkthrough tailored to your current workflow.\n\nBest,\nYour Name`;
}
