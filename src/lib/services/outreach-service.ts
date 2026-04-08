import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { Company, Contact, OutreachAttempt } from "@/lib/types";
import { getCompanyById } from "@/lib/services/company-service";
import { getContactsByCompanyId } from "@/lib/services/contact-service";

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

async function requestOpenAi(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 250,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  return payload.output_text?.trim() ?? null;
}

export async function generateCompanySummary(company: Company): Promise<string> {
  const prompt = `Write a short beginner-friendly sales summary for ${company.company_name}. Include one sentence on fit and one sentence on outreach angle. Category: ${company.primary_category}. Stage: ${company.pipeline_stage}. Notes: ${company.notes}`;

  const realSummary = await requestOpenAi(prompt);

  if (realSummary) {
    return realSummary;
  }

  return `${company.company_name} is a ${company.primary_category.toLowerCase()} in ${company.city}. Current stage is ${company.pipeline_stage}. Recommended focus: ${company.notes || "confirm best decision-maker and pain points."}`;
}

export async function generateOutreachDraft(company: Company, contact: Contact | undefined): Promise<string> {
  const contactName = contact?.full_name ?? "team";
  const prompt = `Write a concise friendly cold outreach email draft. Company: ${company.company_name}. Category: ${company.primary_category}. Contact: ${contactName}. Keep under 140 words.`;

  const realDraft = await requestOpenAi(prompt);

  if (realDraft) {
    return realDraft;
  }

  return `Hi ${contactName},\n\nI came across ${company.company_name} and wanted to share a quick idea to improve inbound lead handling for ${company.primary_category.toLowerCase()} teams. If helpful, I can send a short walkthrough tailored to your current workflow.\n\nBest,\nYour Name`;
}

export async function createOrUpdateOutreachAttempt(input: { companyId: string; contactId: string }) {
  const company = await getCompanyById(input.companyId);

  if (!company) {
    throw new Error("Company not found.");
  }

  const contacts = await getContactsByCompanyId(input.companyId);
  const contact = contacts.find((item) => item.id === input.contactId);

  if (!contact) {
    throw new Error("Contact not found.");
  }

  const existingAttempts = await getOutreachByContactIds([contact.id]);
  const generatedBody = await generateOutreachDraft(company, contact);
  const generatedSubject = `Quick idea for ${company.company_name}`;

  if (existingAttempts[0]) {
    return updateOutreachAttempt(existingAttempts[0].id, {
      draft_status: "ready",
      status: "not_sent",
      subject_line: generatedSubject,
      body_snapshot: generatedBody,
    });
  }

  return createOutreachAttempt({
    contact_id: contact.id,
    sequence_number: 1,
    subject_line: generatedSubject,
    body_snapshot: generatedBody,
  });
}
