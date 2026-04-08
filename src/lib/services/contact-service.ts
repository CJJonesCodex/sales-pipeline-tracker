import { contacts } from "@/lib/mock-data/contacts";
import { discoveryRuns } from "@/lib/mock-data/discovery-runs";
import { Contact, DiscoveryRun } from "@/lib/types";

export function getAllContacts(): Contact[] {
  return contacts;
}

export function getContactsByCompanyId(companyId: string): Contact[] {
  return contacts.filter((contact) => contact.company_id === companyId);
}

export function getDiscoveryRunsByCompanyId(companyId: string): DiscoveryRun[] {
  return discoveryRuns.filter((run) => run.company_id === companyId);
}
