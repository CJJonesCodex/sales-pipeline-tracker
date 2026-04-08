import { getImportedCompanies } from "@/lib/services/company-service";
import { PipelineStage } from "@/lib/types";

export const pipelineStages: PipelineStage[] = [
  "Lead",
  "Qualified",
  "Contacted",
  "Proposal",
  "Won",
  "Lost",
];

export function getPipelineColumns() {
  const companies = getImportedCompanies();

  return pipelineStages.map((stage) => ({
    stage,
    companies: companies.filter((company) => company.pipeline_stage === stage),
  }));
}
