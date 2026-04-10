import { PageHeader } from "@/components/ui/page-header";
import { getImportedCompanies } from "@/lib/services/company-service";
import { getAllContacts } from "@/lib/services/contact-service";

export default async function DashboardPage() {
  try {
    const companies = await getImportedCompanies();
    const contacts = await getAllContacts();

    const followUpDueCount = companies.filter((company) => company.pipeline_stage === "follow_up_due").length;
    const qualifiedCount = companies.filter((company) => company.pipeline_stage === "qualified").length;
    const primaryContacts = contacts.filter((contact) => contact.is_primary).length;

    return (
      <main>
        <PageHeader
          title="Dashboard"
          description="Quick overview of pipeline automation signals, qualification, and next actions from CRM data."
        />

        <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Imported Companies</p>
            <p className="mt-2 text-3xl font-semibold">{companies.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Discovered Contacts</p>
            <p className="mt-2 text-3xl font-semibold">{contacts.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Primary Contacts Selected</p>
            <p className="mt-2 text-3xl font-semibold">{primaryContacts}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Follow-up Due</p>
            <p className="mt-2 text-3xl font-semibold">{followUpDueCount}</p>
          </article>
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Pipeline focus</h2>
          <p className="mt-2 text-sm text-slate-600">Qualified opportunities: {qualifiedCount}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {companies.slice(0, 5).map((company) => (
              <li key={company.id} className="rounded border border-slate-200 p-2">
                <p className="font-medium">{company.company_name}</p>
                <p className="text-xs text-slate-500">Stage: {company.pipeline_stage}</p>
                <p className="text-xs text-slate-600">Next action: {company.next_recommended_action}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <PageHeader title="Dashboard" description="Could not load dashboard metrics from Supabase." />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      </main>
    );
  }
}
