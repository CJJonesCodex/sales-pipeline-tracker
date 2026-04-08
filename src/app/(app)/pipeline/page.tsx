import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PageHeader } from "@/components/ui/page-header";
import { getPipelineColumns } from "@/lib/services/pipeline-service";

export default async function PipelinePage() {
  try {
    const columns = await getPipelineColumns();

    return (
      <main>
        <PageHeader
          title="Pipeline Board"
          description="Kanban-style view of imported companies with stage updates persisted to Supabase."
        />
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
