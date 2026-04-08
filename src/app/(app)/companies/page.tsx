import Link from "next/link";
import { CompanySearchTable } from "@/components/companies/company-search-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  getImportedCompanyMapByExternalId,
  searchCompaniesByLocation,
} from "@/lib/services/company-service";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const query = params.query ?? "";

  try {
    const importedCompanyMap = await getImportedCompanyMapByExternalId();
    const importedCompanies = Array.from(importedCompanyMap.values());
    const companies = searchCompaniesByLocation(query).map((company) => {
      const importedCompany = importedCompanyMap.get(company.external_place_id);

      return {
        company,
        importedCompanyId: importedCompany?.id ?? null,
      };
    });

    return (
      <main>
        <PageHeader
          title="Company Search & Import"
          description="Search by zip code or location using mock business listing data, then import into your real CRM database."
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
            <button className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700" type="submit">
              Search (Mock)
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Search results are still mocked. Import writes selected companies into Supabase.
          </p>
        </form>

        {companies.length ? (
          <CompanySearchTable companies={companies} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No mock companies matched your search.
          </div>
        )}

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Imported Companies (Supabase)</h2>
          {importedCompanies.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {importedCompanies.map((company) => (
                <li key={company.id}>
                  <Link href={`/companies/${company.id}`} className="text-brand-700 hover:underline">
                    {company.company_name}
                  </Link>
                  <span className="ml-2 text-slate-500">({company.pipeline_stage})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No companies imported yet.</p>
          )}
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <PageHeader title="Company Search & Import" description="Unable to load import state from Supabase." />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      </main>
    );
  }
}
