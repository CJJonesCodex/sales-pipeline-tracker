"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markPrimaryContact, updateContact } from "@/lib/services/contact-service";

export async function updateContactAction(formData: FormData) {
  const contactId = String(formData.get("contactId") ?? "");

  try {
    await updateContact(contactId, {
      professional_title: String(formData.get("professional_title") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      verified_status: String(formData.get("verified_status") ?? "unverified") as
        | "verified"
        | "likely"
        | "unverified",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update contact.";
    redirect(`/contacts?contactUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/contacts");
  redirect("/contacts?contactUpdate=success");
}

export async function markPrimaryContactAction(formData: FormData) {
  const contactId = String(formData.get("contactId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/contacts");

  try {
    await markPrimaryContact(companyId, contactId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to set primary contact.";
    redirect(`${returnTo}?contactUpdate=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/contacts");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect(`${returnTo}?contactUpdate=success`);
}
