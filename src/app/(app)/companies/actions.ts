"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pipelineStages } from "@/lib/pipeline";
import { PipelineStage } from "@/lib/types";
import { getCompanyById, importMockCompany, seedSmokeTestData, updateCompanyDetails } from "@/lib/services/company-service";
import { autoSelectBestContact, getContactsByCompanyId, runMockContactDiscovery } from "@/lib/services/contact-service";
import { createOutreachAttempt, generatePrimaryDraft, updateOutreachAttempt, updateOutreachLifecycle } from "@/lib/services/outreach-service";
import { importCsvIntoSupabase } from "@/lib/services/csv-import-service";
import { CsvImportType } from "@/lib/csv-import";

const validStages = pipelineStages;

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
  let successCompanyId = "";

  try {
    const result = await seedSmokeTestData();
    successCompanyId = result.companyId;
    revalidatePath("/companies");
    revalidatePath(`/companies/${result.companyId}`);
    revalidatePath("/contacts");
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to seed data.";
    redirect(`/companies?seed=error&message=${encodeURIComponent(message)}`);
  }

  redirect(`/companies?seed=success&companyId=${encodeURIComponent(successCompanyId)}`);
}

export async function updateCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const pipelineStage = String(formData.get("pipeline_stage") ?? "new") as PipelineStage;
  const nextFollowUpAt = String(formData.get("next_follow_up_at") ?? "");
  const hasContacts = String(formData.get("has_contacts") ?? "false") === "true";
  const hasPrimaryContact = String(formData.get("has_primary_contact") ?? "false") === "true";

  if (!validStages.includes(pipelineStage)) {
    redirect(`/companies/${companyId}?companyUpdate=error&message=${encodeURIComponent("Invalid pipeline stage.")}`);
  }

  try {
    await updateCompanyDetails(companyId, {
      notes,
      pipeline_stage: pipelineStage,
      next_follow_up_at: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
      has_contacts: hasContacts,
      has_primary_contact: hasPrimaryContact,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save company updates.";
    redirect(`/companies/${companyId}?companyUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect(`/companies/${companyId}?companyUpdate=success`);
}

export async function updatePipelineStageAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const pipelineStage = String(formData.get("pipeline_stage") ?? "new") as PipelineStage;

  if (!validStages.includes(pipelineStage)) {
    redirect(`/pipeline?stageUpdate=error&message=${encodeURIComponent("Invalid pipeline stage.")}`);
  }

  try {
    await updateCompanyDetails(companyId, {
      notes: String(formData.get("notes") ?? ""),
      pipeline_stage: pipelineStage,
      next_follow_up_at: String(formData.get("next_follow_up_at") ?? "") || null,
      has_contacts: String(formData.get("has_contacts") ?? "false") === "true",
      has_primary_contact: String(formData.get("has_primary_contact") ?? "false") === "true",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update pipeline stage.";
    redirect(`/pipeline?stageUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/pipeline");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/dashboard");
  redirect("/pipeline?stageUpdate=success");
}

export async function createOutreachAttemptAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");
  try {
    await createOutreachAttempt({
      contact_id: String(formData.get("contact_id") ?? ""),
      sequence_number: Number(formData.get("sequence_number") ?? "1"),
      subject_line: String(formData.get("subject_line") ?? ""),
      body_snapshot: String(formData.get("body_snapshot") ?? ""),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create outreach attempt.";
    redirect(`/companies/${companyId}?outreachCreate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}?outreachCreate=success`);
}

export async function generatePrimaryDraftAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");

  try {
    const company = await getCompanyById(companyId);
    if (!company) {
      throw new Error("Company not found.");
    }

    const contacts = await getContactsByCompanyId(companyId);
    const primary = contacts.find((contact) => contact.is_primary) ?? contacts[0] ?? null;
    await generatePrimaryDraft(company, primary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate draft.";
    redirect(`/companies/${companyId}?outreachUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  redirect(`/companies/${companyId}?outreachUpdate=success`);
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

export async function autoSelectBestContactAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");

  try {
    await autoSelectBestContact(companyId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to auto-select best contact.";
    redirect(`/companies/${companyId}?companyUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  redirect(`/companies/${companyId}?companyUpdate=success`);
}

export async function updateOutreachLifecycleAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");
  const transition = String(formData.get("transition") ?? "");

  try {
    const company = await getCompanyById(companyId);
    if (!company) {
      throw new Error("Company not found.");
    }

    if (transition === "mark_ready") {
      await updateOutreachLifecycle(company, {
        draftStatus: "ready",
        stage: "draft_ready",
        activityType: "draft_marked_ready",
        activityNote: "Draft marked ready for human-approved send.",
      });
    } else if (transition === "mark_contacted") {
      await updateOutreachLifecycle(company, {
        sendStatus: "contacted",
        stage: "contacted",
        firstContactedAt: company.first_contacted_at ?? new Date().toISOString(),
        activityType: "contacted",
        activityNote: "Marked as first contact completed (human approved).",
      });
    } else if (transition === "schedule_follow_up") {
      const dueDate = String(formData.get("follow_up_due_at") ?? "");
      if (!dueDate) {
        throw new Error("Select a follow-up date.");
      }
      await updateOutreachLifecycle(company, {
        followUpDueAt: new Date(dueDate).toISOString(),
        stage: "follow_up_due",
        activityType: "follow_up_scheduled",
        activityNote: `Follow-up scheduled for ${new Date(dueDate).toLocaleDateString()}.`,
      });
    } else if (transition === "mark_replied") {
      await updateOutreachLifecycle(company, {
        sendStatus: "replied",
        stage: "replied",
        activityType: "status_updated",
        activityNote: "Lead marked as replied.",
      });
    } else if (transition === "mark_qualified") {
      await updateOutreachLifecycle(company, {
        sendStatus: "qualified",
        stage: "qualified",
        activityType: "status_updated",
        activityNote: "Lead marked as qualified.",
      });
    } else if (transition === "mark_won") {
      await updateOutreachLifecycle(company, {
        sendStatus: "won",
        stage: "won",
        activityType: "status_updated",
        activityNote: "Opportunity marked as won.",
      });
    } else if (transition === "mark_lost") {
      const stopReason = String(formData.get("stop_reason") ?? "No reason provided");
      await updateOutreachLifecycle(company, {
        sendStatus: "lost",
        stage: "lost",
        stopReason,
        activityType: "stopped",
        activityNote: `Lead marked lost. Reason: ${stopReason}`,
      });
    } else {
      throw new Error("Invalid outreach transition.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update outreach lifecycle.";
    redirect(`/companies/${companyId}?outreachUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect(`/companies/${companyId}?outreachUpdate=success`);
}

export async function updateOutreachAttemptAction(formData: FormData) {
  const companyId = String(formData.get("company_id") ?? "");
  try {
    await updateOutreachAttempt(String(formData.get("attempt_id") ?? ""), {
      draft_status: String(formData.get("draft_status") ?? "drafted") as "drafted" | "ready" | "sent",
      subject_line: String(formData.get("subject_line") ?? ""),
      body_snapshot: String(formData.get("body_snapshot") ?? ""),
      status: String(formData.get("status") ?? "not_sent") as "not_sent" | "sent" | "replied" | "bounced",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update outreach attempt.";
    redirect(`/companies/${companyId}?outreachUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}?outreachUpdate=success`);
}


export async function importCsvAction(formData: FormData) {
  const csvType = String(formData.get("csvType") ?? "") as CsvImportType;
  const csvText = String(formData.get("csvText") ?? "");

  if (!["companies", "contacts", "outreach_attempts"].includes(csvType)) {
    redirect(`/companies?csv=error&message=${encodeURIComponent("Select a valid CSV import type.")}`);
  }

  if (!csvText.trim()) {
    redirect(`/companies?csv=error&message=${encodeURIComponent("Upload a CSV file before importing.")}`);
  }

  let successMessage = "";

  try {
    const result = await importCsvIntoSupabase(csvType, csvText);
    revalidatePath("/companies");
    revalidatePath("/contacts");
    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    const details = `Imported ${result.inserted}, skipped ${result.skipped}`;
    const firstError = result.errors[0] ? ` | ${result.errors[0]}` : "";
    successMessage = `${csvType}: ${details}${firstError}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "CSV import failed.";
    redirect(`/companies?csv=error&message=${encodeURIComponent(message)}`);
  }

  redirect(`/companies?csv=success&message=${encodeURIComponent(successMessage)}`);
}
