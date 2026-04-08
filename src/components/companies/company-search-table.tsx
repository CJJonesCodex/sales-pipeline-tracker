import Link from "next/link";
import { importCompanyAction } from "@/app/(app)/companies/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Company } from "@/lib/types";

type CompanyRow = {
  company: Company;
  importedCompanyId: string | null;
};

export function CompanySearchTable({ companies }: { companies: CompanyRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Website</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(({ company, importedCompanyId }) => (
            <tr key={company.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium">{company.company_name}</td>
              <td className="px-4 py-3">{company.city}, {company.state}</td>
              <td className="px-4 py-3">{company.website_url || "No site found"}</td>
              <td className="px-4 py-3"><StatusBadge status={company.website_status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {importedCompanyId ? (
                    <Link href={`/companies/${importedCompanyId}`} className="font-medium text-brand-600">
                      View detail
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">Import to view detail</span>
                  )}
                  {importedCompanyId ? (
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      Imported
                    </span>
                  ) : (
                    <form action={importCompanyAction}>
                      <input type="hidden" name="companyId" value={company.id} />
                      <button
                        className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                        type="submit"
                      >
                        Import
                      </button>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
