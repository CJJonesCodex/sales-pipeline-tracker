import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/ui/page-header";
import { getAllContacts } from "@/lib/services/contact-service";

export default async function ContactsPage() {
  try {
    const contacts = await getAllContacts();

    return (
      <main>
        <PageHeader
          title="Contacts"
          description="All discovered contacts persisted in Supabase from your CRM data."
        />

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
