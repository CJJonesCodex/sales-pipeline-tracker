import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PageHeader } from "@/components/ui/page-header";

export default function PipelinePage() {
  return (
    <main>
      <PageHeader
        title="Pipeline Board"
        description="Kanban-style view of imported companies and their current stage."
      />
      <PipelineBoard />
    </main>
  );
}
