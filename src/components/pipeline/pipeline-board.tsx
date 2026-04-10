import Link from "next/link";
import { updatePipelineStageAction } from "@/app/(app)/companies/actions";
import { pipelineStages } from "@/lib/pipeline";
import { PipelineStage } from "@/lib/types";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type PipelineColumn = {
  stage: PipelineStage;
  companies: {
    id: string;
    company_name: string;
    primary_category: string;
    notes: string;
    next_follow_up_at: string | null;
    next_recommended_action: string;
    last_touched_at: string;
  }[];
};

const allStages: PipelineStage[] = pipelineStages;

export function PipelineBoard({ columns }: { columns: PipelineColumn[] }) {
  if (!columns.some((column) => column.companies.length)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No companies in your pipeline yet. Import a company from the Companies page to get started.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {columns.map((column) => (
        <section key={column.stage} className="rounded-lg border border-slate-200 bg-white p-3">
          <h2 className="font-semibold">{column.stage}</h2>
          <p className="mb-3 text-xs text-slate-500">{column.companies.length} companies</p>
          <div className="space-y-2">
            {column.companies.map((company) => (
              <div key={company.id} className="rounded border border-slate-200 p-2 text-sm">
                <Link href={`/companies/${company.id}`} className="block hover:text-brand-700">
                  <p className="font-medium">{company.company_name}</p>
                  <p className="text-xs text-slate-500">{company.primary_category}</p>
                  <p className="mt-1 text-xs text-slate-600">Next action: {company.next_recommended_action}</p>
                  <p className="text-xs text-slate-500">Follow-up: {company.next_follow_up_at ? new Date(company.next_follow_up_at).toLocaleDateString() : "Not set"}</p>
                  <p className="text-xs text-slate-500">Last touched: {new Date(company.last_touched_at).toLocaleDateString()}</p>
                </Link>

                <form action={updatePipelineStageAction} className="mt-2">
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="notes" value={company.notes} />
                  <input type="hidden" name="next_follow_up_at" value={company.next_follow_up_at ?? ""} />
                  <input type="hidden" name="has_contacts" value="true" />
                  <input type="hidden" name="has_primary_contact" value="true" />
                  <select
                    name="pipeline_stage"
                    defaultValue={column.stage}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                  >
                    {allStages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <FormSubmitButton
                      idleLabel="Update stage"
                      pendingLabel="Updating..."
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
