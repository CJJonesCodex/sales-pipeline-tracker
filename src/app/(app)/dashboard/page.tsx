import { PageHeader } from "@/components/ui/page-header";
import { getImportedCompanies } from "@/lib/services/company-service";
import { getAllContacts } from "@/lib/services/contact-service";

export default async function DashboardPage() {
  const companies = await getImportedCompanies();
  const contacts = await getAllContacts();

  return (
    <main>
      <PageHeader
        title="Dashboard"
        description="Quick overview of your pipeline, contacts, and mock discovery progress."
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
}
