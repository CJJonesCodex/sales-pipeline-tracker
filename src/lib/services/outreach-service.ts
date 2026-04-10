import { getServerUser } from "@/lib/supabase/auth-helpers";
import { supabaseRestRequest } from "@/lib/supabase/rest";
import { Company, Contact, OutreachAttempt, OutreachDraftStatus, OutreachSendStatus, PipelineStage } from "@/lib/types";
import { getNextRecommendedAction } from "@/lib/pipeline";

export type OutreachActivity = {
  id: string;
  user_id: string;
  company_id: string;
  activity_type:
    | "draft_generated"
    | "draft_marked_ready"
    | "contacted"
    | "follow_up_scheduled"
    | "stage_updated"
    | "status_updated"
    | "stopped";
  activity_note: string;
  occurred_at: string;
  created_at: string;
};

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

export async function getOutreachActivitiesByCompanyId(companyId: string): Promise<OutreachActivity[]> {
  return supabaseRestRequest<OutreachActivity[]>("outreach_activities", {
    query: {
      select: "*",
      company_id: `eq.${companyId}`,
      order: "occurred_at.desc",
      limit: "50",
    },
  });
}

async function createOutreachActivity(companyId: string, activityType: OutreachActivity["activity_type"], note: string) {
  const userId = await getCurrentUserId();

  await supabaseRestRequest("outreach_activities", {
    method: "POST",
    query: { select: "id" },
    body: {
      user_id: userId,
      company_id: companyId,
      activity_type: activityType,
      activity_note: note,
      occurred_at: new Date().toISOString(),
    },
  });
}

function computeNextAction(company: Company, updates: { draftStatus?: OutreachDraftStatus; sendStatus?: OutreachSendStatus; followUpDueAt?: string | null; stage?: PipelineStage }) {
  return getNextRecommendedAction({
    stage: updates.stage ?? company.pipeline_stage,
    hasContacts: true,
    hasPrimaryContact: true,
    followUpDueAt: updates.followUpDueAt ?? company.follow_up_due_at,
    draftStatus: updates.draftStatus ?? company.outreach_draft_status,
    sendStatus: updates.sendStatus ?? company.outreach_send_status,
  });
}

export async function generatePrimaryDraft(company: Company, contact: Contact | null) {
  const draft = generateMockOutreachDraft(company, contact ?? undefined);
  const nowIso = new Date().toISOString();
  const nextAction = computeNextAction(company, { draftStatus: "generated", stage: "draft_ready" });

  const rows = await supabaseRestRequest<Company[]>("companies", {
    method: "PATCH",
    query: { select: "*", id: `eq.${company.id}` },
    body: {
      primary_draft: draft,
      outreach_draft_status: "generated",
      pipeline_stage: "draft_ready",
      last_touched_at: nowIso,
      updated_at: nowIso,
      next_recommended_action: nextAction,
    },
  });

  await createOutreachActivity(company.id, "draft_generated", "Generated primary outreach draft.");
  return rows[0];
}

export async function updateOutreachLifecycle(company: Company, updates: {
  draftStatus?: OutreachDraftStatus;
  sendStatus?: OutreachSendStatus;
  firstContactedAt?: string | null;
  followUpDueAt?: string | null;
  stopReason?: string | null;
  stage?: PipelineStage;
  activityType: OutreachActivity["activity_type"];
  activityNote: string;
}) {
  const nowIso = new Date().toISOString();
  const nextAction = computeNextAction(company, {
    draftStatus: updates.draftStatus,
    sendStatus: updates.sendStatus,
    followUpDueAt: updates.followUpDueAt,
    stage: updates.stage,
  });

  const rows = await supabaseRestRequest<Company[]>("companies", {
    method: "PATCH",
    query: { select: "*", id: `eq.${company.id}` },
    body: {
      outreach_draft_status: updates.draftStatus ?? company.outreach_draft_status,
      outreach_send_status: updates.sendStatus ?? company.outreach_send_status,
      first_contacted_at: updates.firstContactedAt ?? company.first_contacted_at,
      follow_up_due_at: updates.followUpDueAt ?? company.follow_up_due_at,
      next_follow_up_at: updates.followUpDueAt ?? company.follow_up_due_at,
      stop_reason: updates.stopReason === undefined ? company.stop_reason : updates.stopReason,
      pipeline_stage: updates.stage ?? company.pipeline_stage,
      next_recommended_action: nextAction,
      last_touched_at: nowIso,
      updated_at: nowIso,
    },
  });

  await createOutreachActivity(company.id, updates.activityType, updates.activityNote);
  return rows[0];
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
