"use server";

import { revalidatePath } from "next/cache";
import { updateContact } from "@/lib/services/contact-service";

export async function updateContactAction(formData: FormData) {
  const contactId = String(formData.get("contactId") ?? "");

  await updateContact(contactId, {
    professional_title: String(formData.get("professional_title") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    verified_status: String(formData.get("verified_status") ?? "unverified") as
      | "verified"
      | "likely"
      | "unverified",
  });

  revalidatePath("/contacts");
}
