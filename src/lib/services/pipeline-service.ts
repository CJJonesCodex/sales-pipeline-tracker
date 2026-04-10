import { getImportedCompanies } from "@/lib/services/company-service";
import { pipelineStages } from "@/lib/pipeline";

export async function getPipelineColumns() {
  const companies = await getImportedCompanies();

  return pipelineStages.map((stage) => ({
    stage,
    companies: companies.filter((company) => company.pipeline_stage === stage),
  }));
}
