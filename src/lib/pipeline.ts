import { Contact, PipelineStage } from "@/lib/types";

export const pipelineStages: PipelineStage[] = [
  "new",
  "website_verified",
  "contacts_found",
  "best_contact_selected",
  "draft_ready",
  "contacted",
  "follow_up_due",
  "replied",
  "qualified",
  "won",
  "lost",
];

const titlePriorityKeywords = [
  "owner",
  "founder",
  "ceo",
  "president",
  "director",
  "manager",
  "operations",
  "marketing",
  "sales",
];

function getTitleScore(title: string) {
  const normalizedTitle = title.toLowerCase();
  return titlePriorityKeywords.some((keyword) => normalizedTitle.includes(keyword)) ? 0.25 : 0;
}

function getContactTypeScore(contactType: Contact["contact_type"]) {
  if (contactType === "person") return 0.25;
  if (contactType === "department") return 0.1;
  return 0;
}

function getVerificationBonus(status: Contact["verified_status"]) {
  if (status === "verified") return 0.1;
  if (status === "likely") return 0.05;
  return 0;
}

export function scoreContactForPrimarySelection(contact: Contact) {
  const weightedScore =
    contact.confidence_score * 0.4 +
    getContactTypeScore(contact.contact_type) +
    getTitleScore(contact.professional_title) +
    getVerificationBonus(contact.verified_status);

  return Number(weightedScore.toFixed(4));
}

export function getBestContact(contacts: Contact[]) {
  const sorted = [...contacts].sort((left, right) => {
    const scoreDelta = scoreContactForPrimarySelection(right) - scoreContactForPrimarySelection(left);

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return right.confidence_score - left.confidence_score;
  });

  return sorted[0] ?? null;
}

export function getNextRecommendedAction(input: {
  stage: PipelineStage;
  hasContacts: boolean;
  hasPrimaryContact: boolean;
  nextFollowUpAt: string | null;
}) {
  if (input.stage === "new") return "Verify official website";
  if (input.stage === "website_verified") return "Run contact discovery";
  if (!input.hasContacts) return "Find contacts for this company";
  if (!input.hasPrimaryContact) return "Select the best contact";
  if (input.stage === "best_contact_selected") return "Prepare outreach draft";
  if (input.stage === "draft_ready") return "Send first outreach";
  if (input.stage === "contacted" || input.stage === "follow_up_due") {
    if (input.nextFollowUpAt) {
      return `Follow up on ${new Date(input.nextFollowUpAt).toLocaleDateString()}`;
    }

    return "Schedule follow-up";
  }
  if (input.stage === "replied") return "Qualify opportunity details";
  if (input.stage === "qualified") return "Advance deal and propose next step";
  if (input.stage === "won") return "Document handoff and upsell opportunities";
  return "Capture loss reason and nurture for later";
}
