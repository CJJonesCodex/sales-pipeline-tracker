import { createClient } from "@/lib/supabase/server";
import { Contact, DiscoveryRun } from "@/lib/types";

export async function getAllContacts(): Promise<Contact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getContactsByCompanyId(companyId: string): Promise<Contact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getDiscoveryRunsByCompanyId(companyId: string): Promise<DiscoveryRun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discovery_runs")
    .select("*")
    .eq("company_id", companyId)
    .order("started_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}
