"use client";

import { FormSubmitButton } from "@/components/ui/form-submit-button";

export function ImportCompanyButton() {
  return (
    <FormSubmitButton
      idleLabel="Import"
      pendingLabel="Importing..."
      className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}
