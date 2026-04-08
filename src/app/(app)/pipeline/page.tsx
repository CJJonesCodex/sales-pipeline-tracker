import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PageHeader } from "@/components/ui/page-header";
import { getPipelineColumns } from "@/lib/services/pipeline-service";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ stageUpdate?: string; message?: string }>;
}) {
  const params = await searchParams;
  const stageUpdateStatus = params.stageUpdate ?? "";
  const message = params.message ?? "";

  try {
    const columns = await getPipelineColumns();

    return (
      <main>
        <PageHeader
          title="Pipeline Board"
          description="Kanban-style view of imported companies with stage updates persisted to Supabase."
        />
        {stageUpdateStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Pipeline stage updated.
          </div>
        ) : null}
        {stageUpdateStatus === "error" ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Pipeline stage update failed: {message || "Please try again."}
          </div>
        ) : null}
        <PipelineBoard columns={columns} />
      </main>
    );
  } catch (error) {
    return (
      <main>
        <PageHeader title="Pipeline Board" description="Could not load pipeline data from Supabase." />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      </main>
    );
  }
}
