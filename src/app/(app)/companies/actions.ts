"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PipelineStage } from "@/lib/types";
import { importMockCompany, seedSmokeTestData, updateCompanyDetails } from "@/lib/services/company-service";
import { runMockContactDiscovery } from "@/lib/services/contact-service";
import { createOutreachAttempt, updateOutreachAttempt } from "@/lib/services/outreach-service";

const validStages: PipelineStage[] = ["Lead", "Qualified", "Contacted", "Proposal", "Won", "Lost"];

export async function importCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const query = String(formData.get("query") ?? "");
  const radius = String(formData.get("radius") ?? "10");

  if (!companyId) {
    redirect(
      `/companies?query=${encodeURIComponent(query)}&radius=${encodeURIComponent(radius)}&import=error&message=${encodeURIComponent("Missing company ID.")}`,
    );
  }

  try {
    await importMockCompany(companyId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    redirect(
      `/companies?query=${encodeURIComponent(query)}&radius=${encodeURIComponent(radius)}&import=error&message=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  redirect(
    `/companies?query=${encodeURIComponent(query)}&radius=${encodeURIComponent(radius)}&import=success&companyId=${encodeURIComponent(companyId)}`,
  );
}

export async function seedSmokeTestAction() {
  try {
    const result = await seedSmokeTestData();
    revalidatePath("/companies");
    revalidatePath(`/companies/${result.companyId}`);
    revalidatePath("/contacts");
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    redirect(`/companies?seed=success&companyId=${encodeURIComponent(result.companyId)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to seed data.";
    redirect(`/companies?seed=error&message=${encodeURIComponent(message)}`);
  }
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

export async function runMockContactDiscoveryAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");

  if (!companyId) {
    redirect("/companies?discovery=error&message=Missing%20company%20ID.");
  }

  try {
    const result = await runMockContactDiscovery(companyId);
    revalidatePath(`/companies/${companyId}`);
    revalidatePath("/contacts");
    revalidatePath("/dashboard");

    redirect(
      `/companies/${companyId}?discovery=success&contactsCreated=${encodeURIComponent(String(result.contactsCreated))}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed.";
    redirect(`/companies/${companyId}?discovery=error&message=${encodeURIComponent(message)}`);
  }
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
