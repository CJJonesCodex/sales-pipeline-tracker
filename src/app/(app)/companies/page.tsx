import { CompanySearchTable } from "@/components/companies/company-search-table";
import { PageHeader } from "@/components/ui/page-header";
import { searchCompaniesByLocation } from "@/lib/services/company-service";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const query = params.query ?? "";
  const companies = searchCompaniesByLocation(query);

  return (
    <main>
      <PageHeader
        title="Company Search & Import"
        description="Search by zip code or location using mock business listing data."
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
          Import is currently simulated by seeded mock data in the table.
        </p>
      </form>

      <CompanySearchTable companies={companies} />
    </main>
  );
}
