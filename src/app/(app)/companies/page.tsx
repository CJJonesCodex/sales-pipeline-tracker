import Link from "next/link";
import { CompanySearchTable } from "@/components/companies/company-search-table";
import { importCsvAction, seedSmokeTestAction } from "@/app/(app)/companies/actions";
import { PageHeader } from "@/components/ui/page-header";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { CsvImportPanel } from "@/components/companies/csv-import-panel";
import {
  discoverCompaniesByArea,
  getImportedCompanyMapByExternalId,
} from "@/lib/services/company-service";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    radius?: string;
    import?: string;
    seed?: string;
    companyId?: string;
    message?: string;
    csv?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.query ?? "";
  const parsedRadius = Number(params.radius ?? "10");
  const radius = Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 10;
  const hasSearchInput = query.trim().length > 0;
  const importStatus = params.import ?? "";
  const seedStatus = params.seed ?? "";
  const seededCompanyId = params.companyId ?? "";
  const importMessage = params.message ?? "";
  const csvStatus = params.csv ?? "";

  try {
    const importedCompanyMap = await getImportedCompanyMapByExternalId();
    const importedCompanies = Array.from(importedCompanyMap.values());

    let discoveredCompanies = [] as ReturnType<typeof discoverCompaniesByArea>;
    let discoveryError = "";

    if (hasSearchInput) {
      try {
        discoveredCompanies = discoverCompaniesByArea({
          locationQuery: query,
          radiusMiles: radius,
        });
      } catch (error) {
        discoveryError = error instanceof Error ? error.message : "Unable to run discovery.";
      }
    }

    const companies = discoveredCompanies.map((company) => {
      const importedCompany = importedCompanyMap.get(company.external_place_id);

      return {
        company,
        importedCompanyId: importedCompany?.id ?? null,
      };
    });

    return (
      <main>
        <PageHeader
          title="Area Search & Company Discovery"
          description="Search by zip code or address with a radius using mock discovery data, then import selected companies into your real Supabase CRM."
        />

        <form className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end">
            <div>
              <label className="block text-sm font-medium" htmlFor="query">
                Zip code or address
              </label>
              <input
                defaultValue={query}
                id="query"
                name="query"
                placeholder="e.g. 60601 or 101 Main St, Chicago"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium" htmlFor="radius">
                Search radius (miles)
              </label>
              <input
                defaultValue={String(Number.isFinite(radius) ? radius : 10)}
                id="radius"
                min={1}
                name="radius"
                step={1}
                type="number"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <button className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700" type="submit">
              Discover Companies
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Discovery is mocked in Milestone 3. Import writes selected companies into Supabase.
          </p>
        </form>


        <CsvImportPanel importAction={importCsvAction} />

        {csvStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            CSV import complete. {importMessage || "Rows were saved to Supabase."}
          </div>
        ) : null}

        {csvStatus === "error" ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            CSV import failed: {importMessage || "Please review your headers and try again."}
          </div>
        ) : null}

        <section className="mb-4 rounded-lg border border-brand-100 bg-brand-50 p-4">
          <h2 className="text-base font-semibold text-brand-800">Seed smoke-test data</h2>
          <p className="mt-1 text-sm text-brand-700">
            Creates a predictable imported company, discovery run, contact, and outreach attempt so the full CRM journey is easy to test.
          </p>
          <form action={seedSmokeTestAction} className="mt-3">
            <FormSubmitButton
              idleLabel="Seed smoke-test path"
              pendingLabel="Seeding..."
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </form>
        </section>

        {seedStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Seed complete. You can now run the full smoke-test flow from step 5 (company detail) onward.
            {seededCompanyId ? (
              <Link href={`/companies/${seededCompanyId}`} className="ml-1 font-medium underline">
                Open seeded company detail.
              </Link>
            ) : null}
          </div>
        ) : null}

        {seedStatus === "error" ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Seed failed: {importMessage || "Please try again."}
          </div>
        ) : null}

        {importStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Company imported successfully. It is now stored in Supabase.
          </div>
        ) : null}

        {importStatus === "error" ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Import failed: {importMessage || "Please try again."}
          </div>
        ) : null}

        {!hasSearchInput ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Enter a zip code or address and radius to discover companies.
          </div>
        ) : discoveryError ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{discoveryError}</div>
        ) : companies.length ? (
          <div className="mb-4">
            <p className="mb-2 text-sm text-slate-600">
              Found {companies.length} mock result{companies.length === 1 ? "" : "s"} within {radius} miles.
            </p>
            <CompanySearchTable companies={companies} query={query} radius={radius} />
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No mock companies matched your area search. Try another zip, address, or radius.
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
        <PageHeader title="Area Search & Company Discovery" description="Unable to load import state from Supabase." />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      </main>
    );
  }
}
