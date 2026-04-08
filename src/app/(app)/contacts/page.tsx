import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/ui/page-header";
import { getAllContacts } from "@/lib/services/contact-service";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ contactUpdate?: string; message?: string }>;
}) {
  const params = await searchParams;
  const contactUpdateStatus = params.contactUpdate ?? "";
  const message = params.message ?? "";

  try {
    const contacts = await getAllContacts();

    return (
      <main>
        <PageHeader
          title="Contacts"
          description="All discovered contacts persisted in Supabase from your CRM data."
        />
        {contactUpdateStatus === "success" ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Contact updated.
          </div>
        ) : null}

        {contactUpdateStatus === "error" ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Contact update failed: {message || "Please try again."}
          </div>
        ) : null}

        {contacts.length ? (
          <ContactsTable contacts={contacts} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No contacts are in your CRM yet.
          </div>
        )}
      </main>
    );
  } catch (error) {
    return (
      <main>
        <PageHeader title="Contacts" description="Could not load contacts from Supabase." />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {(error as Error).message}
        </div>
      </main>
    );
  }
}
