import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/ui/page-header";
import { getAllContacts } from "@/lib/services/contact-service";

export default async function ContactsPage() {
  const contacts = await getAllContacts();

  return (
    <main>
      <PageHeader
        title="Contacts"
        description="All discovered contacts saved in Supabase. Contact discovery is still mocked for v1."
      />
      <ContactsTable contacts={contacts} />
    </main>
  );
}
