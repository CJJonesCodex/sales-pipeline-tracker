import Link from "next/link";
import { importCompanyAction } from "@/app/(app)/companies/actions";
import { Company } from "@/lib/types";
import { ImportCompanyButton } from "@/components/companies/import-company-button";

type CompanyRow = {
  company: Company;
  importedCompanyId: string | null;
};

export function CompanySearchTable({
  companies,
  query,
  radius,
}: {
  companies: CompanyRow[];
  query: string;
  radius: number;
}) {
  function getWebsiteStatusClassName(status: Company["website_status"]) {
    if (status === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "likely") return "border-amber-200 bg-amber-50 text-amber-700";
    if (status === "mismatch") return "border-rose-200 bg-rose-50 text-rose-700";
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Website</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Website Status</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(({ company, importedCompanyId }) => (
            <tr key={company.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium">{company.company_name}</td>
              <td className="px-4 py-3">{company.formatted_address}</td>
              <td className="px-4 py-3">{company.website_url || "No site found"}</td>
              <td className="px-4 py-3">{company.main_phone || "No phone"}</td>
              <td className="px-4 py-3">
                <span className={`rounded border px-2 py-1 text-xs ${getWebsiteStatusClassName(company.website_status)}`}>
                  {company.website_status}
                </span>
              </td>
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
                      <input type="hidden" name="query" value={query} />
                      <input type="hidden" name="radius" value={String(radius)} />
                      <ImportCompanyButton />
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
