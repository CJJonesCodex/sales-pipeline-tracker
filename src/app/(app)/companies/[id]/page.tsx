import { notFound } from "next/navigation";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createOutreachAttemptAction,
  updateCompanyAction,
  updateOutreachAttemptAction,
} from "@/app/(app)/companies/actions";
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
  getOutreachByContactIds,
} from "@/lib/services/outreach-service";

const stageOptions = ["Lead", "Qualified", "Contacted", "Proposal", "Won", "Lost"];

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const company = await getCompanyById(id);

    if (!company) {
      notFound();
    }

    const contacts = await getContactsByCompanyId(company.id);
    const discoveryRuns = await getDiscoveryRunsByCompanyId(company.id);
    const outreachAttempts = await getOutreachByContactIds(contacts.map((contact) => contact.id));
    const summary = generateMockCompanySummary(company);
    const outreachDraft = generateMockOutreachDraft(company, contacts[0]);

    return (
      <main>
        <PageHeader
          title={company.company_name}
          description="Company detail view with real CRM persistence and mock verification/search/AI features."
        />

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Company Profile</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="font-medium">Category</dt><dd>{company.primary_category}</dd></div>
              <div><dt className="font-medium">Address</dt><dd>{company.formatted_address}</dd></div>
              <div><dt className="font-medium">Phone</dt><dd>{company.main_phone || "Not available"}</dd></div>
              <div><dt className="font-medium">Website</dt><dd>{company.website_url || "No site"}</dd></div>
              <div><dt className="font-medium">Website Status</dt><dd><StatusBadge status={company.website_status} /></dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-600">{getMockWebsiteVerificationReason(company)}</p>

            <form action={updateCompanyAction} className="mt-4 space-y-3 rounded border border-slate-200 p-3">
              <input type="hidden" name="companyId" value={company.id} />
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="pipeline_stage">Pipeline stage</label>
                <select
                  id="pipeline_stage"
                  name="pipeline_stage"
                  defaultValue={company.pipeline_stage}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={company.notes}
                  rows={4}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Save company updates
              </button>
            </form>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Discovery Runs</h2>
            {discoveryRuns.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {discoveryRuns.map((run) => (
                  <li key={run.id} className="rounded border border-slate-200 p-2">
                    <p className="font-medium">Status: {run.status}</p>
                    <p>Pages scanned: {run.pages_scanned}</p>
                    <p>Contacts found: {run.contacts_found}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No discovery runs yet for this company.</p>
            )}
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
          {contacts.length ? (
            <ContactsTable contacts={contacts} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No contacts found for this company yet.
            </div>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Outreach Attempts</h2>

          {contacts.length ? (
            <form action={createOutreachAttemptAction} className="mt-3 grid gap-3 rounded border border-slate-200 p-3 lg:grid-cols-2">
              <input type="hidden" name="company_id" value={company.id} />
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="contact_id">Contact</label>
                <select id="contact_id" name="contact_id" className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>{contact.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="sequence_number">Sequence #</label>
                <input id="sequence_number" name="sequence_number" defaultValue="1" className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium" htmlFor="subject_line">Subject</label>
                <input id="subject_line" name="subject_line" className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" required />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium" htmlFor="body_snapshot">Body</label>
                <textarea id="body_snapshot" name="body_snapshot" rows={4} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" required />
              </div>
              <button type="submit" className="w-fit rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Create outreach attempt
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Add contacts before creating outreach attempts.</p>
          )}

          {outreachAttempts.length ? (
            <div className="mt-4 space-y-3">
              {outreachAttempts.map((attempt) => (
                <form key={attempt.id} action={updateOutreachAttemptAction} className="space-y-2 rounded border border-slate-200 p-3">
                  <input type="hidden" name="attempt_id" value={attempt.id} />
                  <input type="hidden" name="company_id" value={company.id} />
                  <p className="text-sm font-medium">Attempt #{attempt.sequence_number}</p>
                  <div className="grid gap-2 lg:grid-cols-2">
                    <select name="draft_status" defaultValue={attempt.draft_status} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
                      <option value="drafted">drafted</option>
                      <option value="ready">ready</option>
                      <option value="sent">sent</option>
                    </select>
                    <select name="status" defaultValue={attempt.status} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
                      <option value="not_sent">not_sent</option>
                      <option value="sent">sent</option>
                      <option value="replied">replied</option>
                      <option value="bounced">bounced</option>
                    </select>
                  </div>
                  <input name="subject_line" defaultValue={attempt.subject_line} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                  <textarea name="body_snapshot" defaultValue={attempt.body_snapshot} rows={3} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                  <button type="submit" className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50">
                    Save outreach attempt
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No outreach attempts yet.</p>
          )}
        </section>
      </main>
    );
  } catch (error) {
    if ((error as { digest?: string }).digest === "NEXT_NOT_FOUND") {
      throw error;
    }

    return (
      <main>
        <PageHeader title="Company" description="Could not load company data from Supabase." />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      </main>
    );
  }
}
