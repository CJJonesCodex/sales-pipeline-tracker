import { ContactsTable } from "@/components/contacts/contacts-table";
import { PageHeader } from "@/components/ui/page-header";
import { getAllContacts } from "@/lib/services/contact-service";

export default function ContactsPage() {
  const contacts = getAllContacts();

  return (
    <main>
      <PageHeader
        title="Contacts"
        description="All discovered contacts from mock public business page crawling."
      />
      <ContactsTable contacts={contacts} />
    </main>
  );
}
