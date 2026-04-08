import { PageHeader } from "@/components/ui/page-header";
import { getImportedCompanies } from "@/lib/services/company-service";
import { getAllContacts } from "@/lib/services/contact-service";

export default async function DashboardPage() {
  try {
    const companies = await getImportedCompanies();
    const contacts = await getAllContacts();

    return (
      <main>
        <PageHeader
          title="Dashboard"
          description="Quick overview of your pipeline, contacts, and outreach drafts from real CRM data."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Imported Companies</p>
            <p className="mt-2 text-3xl font-semibold">{companies.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Discovered Contacts</p>
            <p className="mt-2 text-3xl font-semibold">{contacts.length}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Mock Outreach Drafts</p>
            <p className="mt-2 text-3xl font-semibold">1</p>
          </article>
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
