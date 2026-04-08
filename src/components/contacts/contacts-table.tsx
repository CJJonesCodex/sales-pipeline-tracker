import { Contact } from "@/lib/types";

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
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
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-t border-slate-200">
              <td className="px-4 py-3 font-medium">{contact.full_name}</td>
              <td className="px-4 py-3">{contact.professional_title}</td>
              <td className="px-4 py-3">{contact.contact_type}</td>
              <td className="px-4 py-3">{contact.email}</td>
              <td className="px-4 py-3">{contact.phone}</td>
              <td className="px-4 py-3">{Math.round(contact.confidence_score * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
