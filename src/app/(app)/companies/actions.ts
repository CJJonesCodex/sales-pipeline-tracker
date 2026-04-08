"use server";

import { revalidatePath } from "next/cache";
import { importMockCompany } from "@/lib/services/company-service";

export async function importCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");

  await importMockCompany(companyId);
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
}
