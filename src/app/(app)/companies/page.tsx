import Link from "next/link";
import { CompanySearchTable } from "@/components/companies/company-search-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  getImportedCompanies,
  searchCompaniesByLocation,
} from "@/lib/services/company-service";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const query = params.query ?? "";
  const searchResults = searchCompaniesByLocation(query);
  const importedCompanies = await getImportedCompanies();

  return (
    <main>
      <PageHeader
        title="Company Search & Import"
        description="Search by zip code or location using mock business listing data, then import into Supabase."
      />

      <form className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium" htmlFor="query">
          Zip code, city, or address
        </label>
        <div className="mt-2 flex gap-2">
          <input
            defaultValue={query}
            id="query"
            name="query"
            placeholder="e.g. 60601 or Chicago"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
            type="submit"
          >
            Search (Mock)
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Search is mock data; import writes selected companies into Supabase.
        </p>
      </form>

      <CompanySearchTable companies={searchResults} />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Imported Companies (Supabase)</h2>
        {importedCompanies.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No imported companies yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {importedCompanies.map((company) => (
              <li key={company.id}>
                <Link className="text-sm font-medium" href={`/companies/${company.id}`}>
                  {company.company_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
