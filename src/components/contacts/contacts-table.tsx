import { markPrimaryContactAction, updateContactAction } from "@/app/(app)/contacts/actions";
import { scoreContactForPrimarySelection } from "@/lib/pipeline";
import { Contact } from "@/lib/types";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export function ContactsTable({ contacts, returnTo = "/contacts" }: { contacts: Contact[]; returnTo?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Qualification</th>
            <th className="px-4 py-3">Verified</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-t border-slate-200 align-top">
              <td className="px-4 py-3 font-medium">
                {contact.full_name}
                {contact.is_primary ? (
                  <span className="ml-2 rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Primary</span>
                ) : null}
              </td>
              <td className="px-4 py-3">{contact.professional_title}</td>
              <td className="px-4 py-3">{contact.contact_type}</td>
              <td className="px-4 py-3">{contact.email}</td>
              <td className="px-4 py-3">{contact.phone}</td>
              <td className="px-4 py-3">{Math.round(contact.confidence_score * 100)}%</td>
              <td className="px-4 py-3">{Math.round(scoreContactForPrimarySelection(contact) * 100)}%</td>
              <td className="px-4 py-3">{contact.verified_status}</td>
              <td className="px-4 py-3">
                <form action={updateContactAction} className="space-y-2">
                  <input type="hidden" name="contactId" value={contact.id} />
                  <input type="hidden" name="professional_title" value={contact.professional_title} />
                  <input name="email" defaultValue={contact.email} className="w-44 rounded border border-slate-300 px-2 py-1" />
                  <input name="phone" defaultValue={contact.phone} className="w-36 rounded border border-slate-300 px-2 py-1" />
                  <select name="verified_status" defaultValue={contact.verified_status} className="w-32 rounded border border-slate-300 px-2 py-1">
                    <option value="verified">verified</option>
                    <option value="likely">likely</option>
                    <option value="unverified">unverified</option>
                  </select>
                  <div className="flex gap-2">
                    <FormSubmitButton
                      idleLabel="Save"
                      pendingLabel="Saving..."
                      className="block rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </form>
                {!contact.is_primary ? (
                  <form action={markPrimaryContactAction} className="mt-2">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="companyId" value={contact.company_id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <FormSubmitButton
                      idleLabel="Mark primary"
                      pendingLabel="Setting..."
                      className="block rounded bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
