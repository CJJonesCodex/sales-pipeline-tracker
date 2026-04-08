import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Company } from "@/lib/types";

export function CompanySearchTable({ companies }: { companies: Company[] }) {
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
          {companies.map((company) => (
            <tr key={company.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium">{company.company_name}</td>
              <td className="px-4 py-3">{company.city}, {company.state}</td>
              <td className="px-4 py-3">{company.website_url || "No site found"}</td>
              <td className="px-4 py-3"><StatusBadge status={company.website_status} /></td>
              <td className="px-4 py-3">
                <Link href={`/companies/${company.id}`} className="font-medium text-brand-600">
                  View detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
