import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PageHeader } from "@/components/ui/page-header";
import { getPipelineColumns } from "@/lib/services/pipeline-service";

export default async function PipelinePage() {
  const columns = await getPipelineColumns();

  return (
    <main>
      <PageHeader
        title="Pipeline Board"
        description="Kanban-style view of imported companies stored in Supabase."
      />
      <PipelineBoard columns={columns} />
    </main>
  );
}
