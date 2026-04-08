import { notFound } from "next/navigation";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCompanyById,
  getMockWebsiteVerificationReason,
} from "@/lib/services/company-service";
import {
  getContactsByCompanyId,
  getDiscoveryRunsByCompanyId,
} from "@/lib/services/contact-service";
import {
  generateMockCompanySummary,
  generateMockOutreachDraft,
} from "@/lib/services/outreach-service";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  const contacts = await getContactsByCompanyId(company.id);
  const discoveryRuns = await getDiscoveryRunsByCompanyId(company.id);
  const summary = generateMockCompanySummary(company);
  const outreachDraft = generateMockOutreachDraft(company, contacts[0]);

  return (
    <main>
      <PageHeader
        title={company.company_name}
        description="Company detail view with mock verification, discovery, AI summary, and outreach draft."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Company Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="font-medium">Category</dt><dd>{company.primary_category}</dd></div>
            <div><dt className="font-medium">Address</dt><dd>{company.formatted_address}</dd></div>
            <div><dt className="font-medium">Phone</dt><dd>{company.main_phone}</dd></div>
            <div><dt className="font-medium">Website</dt><dd>{company.website_url || "No site"}</dd></div>
            <div><dt className="font-medium">Website Status</dt><dd><StatusBadge status={company.website_status} /></dd></div>
          </dl>
          <p className="mt-3 text-xs text-slate-600">{getMockWebsiteVerificationReason(company)}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Discovery Runs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {discoveryRuns.map((run) => (
              <li key={run.id} className="rounded border border-slate-200 p-2">
                <p className="font-medium">Status: {run.status}</p>
                <p>Pages scanned: {run.pages_scanned}</p>
                <p>Contacts found: {run.contacts_found}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Mock AI Company Summary</h2>
          <p className="mt-3 whitespace-pre-line text-sm">{summary}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Mock Outreach Draft</h2>
          <p className="mt-3 whitespace-pre-line text-sm">{outreachDraft}</p>
        </article>
      </section>

      <section className="mt-4">
        <h2 className="mb-3 text-lg font-semibold">Contacts</h2>
        <ContactsTable contacts={contacts} />
      </section>
    </main>
  );
}
