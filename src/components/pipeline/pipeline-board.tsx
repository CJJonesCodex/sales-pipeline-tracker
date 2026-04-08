import Link from "next/link";
import { getPipelineColumns } from "@/lib/services/pipeline-service";

export function PipelineBoard() {
  const columns = getPipelineColumns();

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {columns.map((column) => (
        <section key={column.stage} className="rounded-lg border border-slate-200 bg-white p-3">
          <h2 className="font-semibold">{column.stage}</h2>
          <p className="mb-3 text-xs text-slate-500">{column.companies.length} companies</p>
          <div className="space-y-2">
            {column.companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="block rounded border border-slate-200 p-2 text-sm hover:bg-slate-50"
              >
                <p className="font-medium">{company.company_name}</p>
                <p className="text-xs text-slate-500">{company.primary_category}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
