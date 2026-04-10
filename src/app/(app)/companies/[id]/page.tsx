import { notFound } from "next/navigation";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  autoSelectBestContactAction,
  createOutreachAttemptAction,
  runMockContactDiscoveryAction,
  updateCompanyAction,
  updateOutreachAttemptAction,
} from "@/app/(app)/companies/actions";
import { getMockWebsiteVerificationReason, getCompanyById } from "@/lib/services/company-service";
import { getContactsByCompanyId, getDiscoveryRunsByCompanyId } from "@/lib/services/contact-service";
import { generateMockCompanySummary, generateMockOutreachDraft, getOutreachByContactIds } from "@/lib/services/outreach-service";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { getBestContact, pipelineStages } from "@/lib/pipeline";

function formatDateValue(date: string | null) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString();
}

function toDateInputValue(date: string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    discovery?: string;
    contactsCreated?: string;
    message?: string;
    companyUpdate?: string;
    outreachCreate?: string;
    outreachUpdate?: string;
    contactUpdate?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const discoveryStatus = query.discovery ?? "";
  const contactsCreated = Number(query.contactsCreated ?? "0");
  const actionMessage = query.message ?? "";
  const companyUpdateStatus = query.companyUpdate ?? "";
  const outreachCreateStatus = query.outreachCreate ?? "";
  const outreachUpdateStatus = query.outreachUpdate ?? "";

  try {
    const company = await getCompanyById(id);

    if (!company) {
      notFound();
    }

    const contacts = await getContactsByCompanyId(company.id);
    const bestContact = contacts.find((contact) => contact.is_primary) ?? getBestContact(contacts);
    const discoveryRuns = await getDiscoveryRunsByCompanyId(company.id);
    const outreachAttempts = await getOutreachByContactIds(contacts.map((contact) => contact.id));
    const summary = generateMockCompanySummary(company);
    const outreachDraft = generateMockOutreachDraft(company, bestContact ?? contacts[0]);

    return (
      <main>
        <PageHeader
          title={company.company_name}
          description="Company detail view with stage automation, follow-up scheduling, and best-contact qualification."
        />

        {discoveryStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Contact discovery run completed. {contactsCreated} new contact{contactsCreated === 1 ? "" : "s"} added.
          </div>
        ) : null}

        {discoveryStatus === "error" ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Contact discovery failed: {actionMessage || "Please try again."}
          </div>
        ) : null}
        {companyUpdateStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Company profile updates saved.
          </div>
        ) : null}
        {companyUpdateStatus === "error" ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Unable to save company profile updates: {actionMessage || "Please try again."}
          </div>
        ) : null}
        {outreachCreateStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Outreach attempt created.</div>
        ) : null}
        {outreachUpdateStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Outreach attempt updated.</div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Company Profile + Pipeline Automation</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="font-medium">Current Stage</dt><dd>{company.pipeline_stage}</dd></div>
              <div><dt className="font-medium">Last Touched</dt><dd>{formatDateValue(company.last_touched_at)}</dd></div>
              <div><dt className="font-medium">Next Follow-up</dt><dd>{formatDateValue(company.next_follow_up_at)}</dd></div>
              <div><dt className="font-medium">Next Recommended Action</dt><dd>{company.next_recommended_action}</dd></div>
              <div><dt className="font-medium">Category</dt><dd>{company.primary_category}</dd></div>
              <div><dt className="font-medium">Address</dt><dd>{company.formatted_address}</dd></div>
              <div><dt className="font-medium">Phone</dt><dd>{company.main_phone || "Not available"}</dd></div>
              <div><dt className="font-medium">Website</dt><dd>{company.website_url || "No site"}</dd></div>
              <div><dt className="font-medium">Website Status</dt><dd><StatusBadge status={company.website_status} /></dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-600">{getMockWebsiteVerificationReason(company)}</p>

            <form action={updateCompanyAction} className="mt-4 space-y-3 rounded border border-slate-200 p-3">
              <input type="hidden" name="companyId" value={company.id} />
              <input type="hidden" name="has_contacts" value={String(contacts.length > 0)} />
              <input type="hidden" name="has_primary_contact" value={String(Boolean(contacts.find((contact) => contact.is_primary)))} />
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="pipeline_stage">Pipeline stage</label>
                <select
                  id="pipeline_stage"
                  name="pipeline_stage"
                  defaultValue={company.pipeline_stage}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {pipelineStages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="next_follow_up_at">Next follow-up date</label>
                <input
                  id="next_follow_up_at"
                  name="next_follow_up_at"
                  type="date"
                  defaultValue={toDateInputValue(company.next_follow_up_at)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
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
              <FormSubmitButton
                idleLabel="Save company updates"
                pendingLabel="Saving..."
                className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Discovery Runs + Qualification</h2>
            <form action={runMockContactDiscoveryAction} className="mt-3">
              <input type="hidden" name="company_id" value={company.id} />
              <FormSubmitButton
                idleLabel="Find Contacts (mock run)"
                pendingLabel="Running mock discovery..."
                className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
            <form action={autoSelectBestContactAction} className="mt-3">
              <input type="hidden" name="company_id" value={company.id} />
              <FormSubmitButton
                idleLabel="Auto-select best contact"
                pendingLabel="Selecting..."
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
            <p className="mt-2 text-xs text-slate-600">
              Best contact uses confidence score + title relevance + contact type + verification signal.
            </p>
            {bestContact ? (
              <p className="mt-2 text-sm text-slate-700">Current best contact: <span className="font-medium">{bestContact.full_name}</span></p>
            ) : null}
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
            <ContactsTable contacts={contacts} returnTo={`/companies/${company.id}`} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">No contacts found for this company yet.</div>
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
              <FormSubmitButton
                idleLabel="Create outreach attempt"
                pendingLabel="Creating..."
                className="w-fit rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              />
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
                  <FormSubmitButton
                    idleLabel="Save outreach attempt"
                    pendingLabel="Saving..."
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
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
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{(error as Error).message}</div>
      </main>
    );
  }
}
