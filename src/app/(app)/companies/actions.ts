"use server";

import { revalidatePath } from "next/cache";
import { CompanyDiscoveryResult, PipelineStage } from "@/lib/types";
import {
  importDiscoveredCompany,
  updateCompanyDetails,
} from "@/lib/services/company-service";
import {
  createOrUpdateOutreachAttempt,
  createOutreachAttempt,
  updateOutreachAttempt,
} from "@/lib/services/outreach-service";
import { runCompanyDiscovery } from "@/lib/services/contact-service";

const validStages: PipelineStage[] = ["Lead", "Qualified", "Contacted", "Proposal", "Won", "Lost"];

export async function importCompanyAction(formData: FormData) {
  const companyPayload = String(formData.get("companyPayload") ?? "{}");
  const company = JSON.parse(companyPayload) as CompanyDiscoveryResult;

  await importDiscoveredCompany(company);
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
}

export async function runCompanyDiscoveryAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");

  await runCompanyDiscovery(companyId);

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
}

export async function updateCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const pipelineStage = String(formData.get("pipeline_stage") ?? "Lead") as PipelineStage;

  if (!validStages.includes(pipelineStage)) {
    throw new Error("Invalid pipeline stage.");
  }

  await updateCompanyDetails(companyId, {
    notes,
    pipeline_stage: pipelineStage,
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function updatePipelineStageAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const pipelineStage = String(formData.get("pipeline_stage") ?? "Lead") as PipelineStage;

  if (!validStages.includes(pipelineStage)) {
    throw new Error("Invalid pipeline stage.");
  }

  await updateCompanyDetails(companyId, {
    notes: String(formData.get("notes") ?? ""),
    pipeline_stage: pipelineStage,
  });

  revalidatePath("/pipeline");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
}

export async function createOutreachAttemptAction(formData: FormData) {
  await createOutreachAttempt({
    contact_id: String(formData.get("contact_id") ?? ""),
    sequence_number: Number(formData.get("sequence_number") ?? "1"),
    subject_line: String(formData.get("subject_line") ?? ""),
    body_snapshot: String(formData.get("body_snapshot") ?? ""),
  });

  const companyId = String(formData.get("company_id") ?? "");
  revalidatePath(`/companies/${companyId}`);
}

export async function generateOutreachDraftAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");
  const contactId = String(formData.get("contact_id") ?? "");

  await createOrUpdateOutreachAttempt({ companyId, contactId });

  revalidatePath(`/companies/${companyId}`);
}

export async function updateOutreachAttemptAction(formData: FormData) {
  await updateOutreachAttempt(String(formData.get("attempt_id") ?? ""), {
    draft_status: String(formData.get("draft_status") ?? "drafted") as "drafted" | "ready" | "sent",
    subject_line: String(formData.get("subject_line") ?? ""),
    body_snapshot: String(formData.get("body_snapshot") ?? ""),
    status: String(formData.get("status") ?? "not_sent") as "not_sent" | "sent" | "replied" | "bounced",
  });

  const companyId = String(formData.get("company_id") ?? "");
  revalidatePath(`/companies/${companyId}`);
}
